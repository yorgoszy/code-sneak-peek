// Blackmagic Camera Control over BLE
// Based on Blackmagic SDI Camera Control Protocol (open documentation)
//
// Works in two modes:
//  - Web Bluetooth (Android Chrome / Desktop Chrome / Edge)
//  - Capacitor native BLE (iOS/iPadOS via @capacitor-community/bluetooth-le)

import { Capacitor } from '@capacitor/core';
import { BleClient, numbersToDataView, type BleDevice } from '@capacitor-community/bluetooth-le';

// Blackmagic Camera Service UUIDs
export const BMD_SERVICE = '291d567a-6d75-11e6-8b77-86f30ca893d3';
export const BMD_OUTGOING_CC = '5dd3465f-1aee-4299-8493-d2eca2f8e1bb'; // we write here
export const BMD_INCOMING_CC = 'b864e140-76a0-416a-bf30-5876504537d9';
export const BMD_TIMECODE = '6d8f2110-86f1-41bf-9afb-451d87e976c8';
export const BMD_CAMERA_STATUS = '7fe8691d-95dc-4fc5-8abd-ca74339b51b9';
export const BMD_DEVICE_NAME = 'ffac0c52-c9fb-41a0-b063-cc76282eb89c';

export type Platform = 'web' | 'native';

export function detectPlatform(): Platform {
  if (Capacitor.isNativePlatform()) return 'native';
  return 'web';
}

export function isBluetoothAvailable(): boolean {
  if (Capacitor.isNativePlatform()) return true;
  return typeof navigator !== 'undefined' && !!(navigator as BluetoothNavigator).bluetooth;
}

interface BluetoothRequestOptions {
  filters: Array<{ services: string[] }>;
  optionalServices?: string[];
}

interface WebBluetoothCharacteristic extends EventTarget {
  value?: DataView;
  writeValue?: (value: Uint8Array) => Promise<void>;
  writeValueWithResponse?: (value: Uint8Array) => Promise<void>;
  writeValueWithoutResponse?: (value: Uint8Array) => Promise<void>;
  startNotifications?: () => Promise<WebBluetoothCharacteristic>;
}

interface WebBluetoothService {
  getCharacteristic: (uuid: string) => Promise<WebBluetoothCharacteristic>;
}

interface WebBluetoothServer {
  connect: () => Promise<WebBluetoothServer>;
  getPrimaryService: (uuid: string) => Promise<WebBluetoothService>;
  disconnect?: () => void;
}

interface WebBluetoothDevice {
  name?: string;
  gatt?: WebBluetoothServer;
}

interface BluetoothNavigator extends Navigator {
  bluetooth?: {
    requestDevice: (options: BluetoothRequestOptions) => Promise<WebBluetoothDevice>;
  };
}

// ---------- Packet builders ----------
// Header (4 bytes): destination, length, command(0), reserved(0)
// Command (4 bytes): category, parameter, dataType, operation
// Data: payload, padded to 4-byte multiple

function buildPacket(
  category: number,
  parameter: number,
  dataType: number,
  operation: number,
  data: number[] = []
): Uint8Array {
  const cmdLen = 4 + data.length;
  const totalLen = 4 + cmdLen;
  const buf = new Uint8Array(totalLen);
  buf[0] = 0xff; // destination broadcast, as used by working Blackmagic BLE libraries
  buf[1] = cmdLen;
  buf[2] = 0;
  buf[3] = 0;
  buf[4] = category;
  buf[5] = parameter;
  buf[6] = dataType;
  buf[7] = operation;
  for (let i = 0; i < data.length; i++) buf[8 + i] = data[i];
  return buf;
}

// int16 little-endian
function int16(v: number): number[] {
  const n = Math.max(-32768, Math.min(32767, Math.round(v)));
  const lo = n & 0xff;
  const hi = (n >> 8) & 0xff;
  return [lo, hi];
}

// fixed16 (5.11 signed) used by BMD for focus/iris (0..1 range)
function fixed16(v: number): number[] {
  const clamped = Math.max(-1, Math.min(1, v));
  const n = Math.round(clamped * 2048);
  return int16(n);
}

export const Commands = {
  // Lens
  focus: (value: number) => buildPacket(0, 0, 128, 0, fixed16(value)), // 0..1
  autoFocus: () => buildPacket(0, 1, 0, 0, []),
  iris: (value: number) => buildPacket(0, 3, 128, 0, fixed16(value)), // 0..1
  // Transport (start/stop record)
  recordStart: () => buildPacket(10, 1, 1, 0, [2]),
  recordStop: () => buildPacket(10, 1, 1, 0, [0]),
  // Video: white balance (Kelvin)
  whiteBalance: (kelvin: number) => buildPacket(1, 2, 2, 0, [...int16(kelvin), 0, 0]),
  // ISO (gain in dB increments)
  iso: (iso: number) => {
    const buf = new Uint8Array(4);
    const v = Math.round(iso);
    buf[0] = v & 0xff;
    buf[1] = (v >> 8) & 0xff;
    buf[2] = (v >> 16) & 0xff;
    buf[3] = (v >> 24) & 0xff;
    return buildPacket(1, 14, 3, 0, Array.from(buf));
  },
};

// ---------- Connection wrapper ----------

export interface BmdConnection {
  name: string;
  send: (packet: Uint8Array) => Promise<void>;
  disconnect: () => Promise<void>;
}

const CLIENT_NAME = 'HyperKids';
const CAMERA_POWER_ON = new Uint8Array([0x01]);

function encodeName(name: string): Uint8Array {
  return new TextEncoder().encode(name);
}

async function writeWebCharacteristic(characteristic: WebBluetoothCharacteristic, value: Uint8Array): Promise<void> {
  if (characteristic.writeValueWithResponse) {
    await characteristic.writeValueWithResponse(value);
  } else {
    await characteristic.writeValue(value);
  }
}

export async function connectWeb(): Promise<BmdConnection> {
  const nav = navigator as BluetoothNavigator;
  if (!nav.bluetooth) throw new Error('Web Bluetooth not supported in this browser');
  const device = await nav.bluetooth.requestDevice({
    filters: [{ services: [BMD_SERVICE] }],
    optionalServices: [BMD_SERVICE],
  });
  const server = await device.gatt!.connect();
  const service = await server.getPrimaryService(BMD_SERVICE);

  // 1) Write client name to the WRITABLE BMD_DEVICE_NAME characteristic.
  //    This labels our controller in the camera menu.
  try {
    const nameChar = await service.getCharacteristic(BMD_DEVICE_NAME);
    await nameChar.writeValueWithResponse(new TextEncoder().encode('HyperKids'));
  } catch (e) {
    console.warn('[BMD] device name write failed (non-fatal)', e);
  }

  // 2) Subscribe to Camera Status notifications.
  //    This triggers the PIN pairing dialog on the camera screen.
  //    Do NOT write to this characteristic — it is read/notify only.
  try {
    const statusChar = await service.getCharacteristic(BMD_CAMERA_STATUS);
    await statusChar.startNotifications();
    statusChar.addEventListener('characteristicvaluechanged', (ev: Event) => {
      const target = ev.target as WebBluetoothCharacteristic | null;
      if (!target?.value) return;
      console.log('[BMD] status byte:', new Uint8Array(target.value.buffer)[0]);
    });
  } catch (e) {
    console.warn('[BMD] status notifications failed (non-fatal)', e);
  }

  // 3) Subscribe to Incoming CC to keep the link alive.
  try {
    const incoming = await service.getCharacteristic(BMD_INCOMING_CC);
    await incoming.startNotifications();
  } catch (e) {
    console.warn('[BMD] incoming CC notifications failed (non-fatal)', e);
  }

  // 4) Get the Outgoing CC characteristic for sending commands.
  //    Blackmagic requires writeValueWithoutResponse for this characteristic.
  const outgoing = await service.getCharacteristic(BMD_OUTGOING_CC);
  return {
    name: device.name || 'Blackmagic Camera',
    send: async (packet) => {
      if (outgoing.writeValueWithoutResponse) {
        await outgoing.writeValueWithoutResponse(packet);
      } else {
        await outgoing.writeValue(packet);
      }
    },
    disconnect: async () => {
      try { device.gatt?.disconnect(); } catch { /* noop */ }
    },
  };
}

export async function connectNative(): Promise<BmdConnection> {
  await BleClient.initialize({ androidNeverForLocation: true });
  const device: BleDevice = await BleClient.requestDevice({
    services: [BMD_SERVICE],
    optionalServices: [BMD_SERVICE],
  });
  await BleClient.connect(device.deviceId, () => { /* on disconnect */ });

  // 1) Write client name. This only labels the controller in the camera menu.
  try {
    await BleClient.write(
      device.deviceId,
      BMD_SERVICE,
      BMD_DEVICE_NAME,
      numbersToDataView(Array.from(encodeName(CLIENT_NAME)))
    );
  } catch (e) {
    console.warn('[BMD native] device name write failed', e);
  }

  // 2) Subscribe to Camera Status notifications. Do NOT write to this read/notify characteristic.
  try {
    await BleClient.startNotifications(
      device.deviceId,
      BMD_SERVICE,
      BMD_CAMERA_STATUS,
      (value) => { console.log('[BMD native] status', value.getUint8(0)); }
    );
  } catch (e) {
    console.warn('[BMD native] status notifications failed', e);
  }

  // 3) Subscribe to Incoming CC
  try {
    await BleClient.startNotifications(
      device.deviceId,
      BMD_SERVICE,
      BMD_INCOMING_CC,
      () => { /* noop */ }
    );
  } catch (e) {
    console.warn('[BMD native] incoming notifications failed', e);
  }

  return {
    name: device.name || 'Blackmagic Camera',
    send: async (packet) => {
      console.log('[BMD native] outgoing', Array.from(packet));
      await BleClient.writeWithoutResponse(
        device.deviceId,
        BMD_SERVICE,
        BMD_OUTGOING_CC,
        numbersToDataView(Array.from(packet))
      );
    },
    disconnect: async () => {
      try { await BleClient.disconnect(device.deviceId); } catch { /* noop */ }
    },
  };
}

export async function connectBlackmagic(): Promise<BmdConnection> {
  return detectPlatform() === 'native' ? connectNative() : connectWeb();
}
