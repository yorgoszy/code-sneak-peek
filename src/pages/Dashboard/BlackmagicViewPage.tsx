import React, { useEffect, useRef, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Menu, Bluetooth, BluetoothOff, Video as VideoIcon, Circle, Square, Focus, Sun, Cloud, CloudSun, Lightbulb, Zap, Home, RefreshCw } from 'lucide-react';
import { CameraFeed } from '@/components/federation/CameraFeed';
import {
  connectBlackmagic,
  Commands,
  isBluetoothAvailable,
  detectPlatform,
  type BmdConnection,
} from '@/lib/blackmagicBle';

const getErrorMessage = (error: unknown, fallback: string) => (
  error instanceof Error && error.message ? error.message : fallback
);

const BlackmagicViewPage: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(
    typeof window !== 'undefined' ? localStorage.getItem('blackmagic_camera_device_id') : null
  );
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const conn = useRef<BmdConnection | null>(null);
  const [connectedName, setConnectedName] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [recording, setRecording] = useState(false);
  const [focus, setFocus] = useState([0.5]);
  const [iris, setIris] = useState([0.5]);
  const [fStop, setFStop] = useState<number | null>(null);
  const [wb, setWb] = useState([5600]);
  const [iso, setIso] = useState([400]);
  const [lastPacket, setLastPacket] = useState<string>('');
  const [lastError, setLastError] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  // Throttle live BLE sends per control to avoid flooding (~50ms)
  const throttleRef = useRef<Record<string, { last: number; pending: ReturnType<typeof setTimeout> | null; lastArgs: unknown }>>({});
  const throttledSend = (key: string, label: string, build: () => Uint8Array, intervalMs = 60) => {
    const now = Date.now();
    const slot = throttleRef.current[key] || (throttleRef.current[key] = { last: 0, pending: null, lastArgs: null });
    const run = () => {
      slot.last = Date.now();
      slot.pending = null;
      sendOrToast(label, build());
    };
    if (now - slot.last >= intervalMs) {
      run();
    } else {
      if (slot.pending) clearTimeout(slot.pending);
      slot.pending = setTimeout(run, intervalMs - (now - slot.last));
    }
  };

  const platform = detectPlatform();
  const bleAvailable = isBluetoothAvailable();

  useEffect(() => () => {
    cameraStream?.getTracks().forEach(t => t.stop());
  }, [cameraStream]);

  // Enumerate cameras (need permission first)
  useEffect(() => {
    const enumerate = async () => {
      try {
        // If we already have permission, skip the slow getUserMedia probe and
        // enumerate directly — labels will already be available.
        let all = await navigator.mediaDevices.enumerateDevices();
        let hasLabels = all.some(d => d.kind === 'videoinput' && d.label);
        let tmp: MediaStream | null = null;
        if (!hasLabels) {
          // First time: ask for permission with minimal constraints to open as fast as possible.
          tmp = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 320 }, height: { ideal: 240 }, frameRate: { ideal: 15 } },
            audio: false,
          });
          all = await navigator.mediaDevices.enumerateDevices();
        }
        const cams = all.filter(d => d.kind === 'videoinput');
        setDevices(cams);
        const HD = {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 60, max: 60 },
        } as const;
        const saved = localStorage.getItem('blackmagic_camera_device_id');
        const savedExists = saved && cams.some(c => c.deviceId === saved);
        if (savedExists) {
          setSelectedDeviceId(saved!);
          const stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: saved! }, ...HD }, audio: false });
          tmp?.getTracks().forEach(t => t.stop());
          setCameraStream(stream);
        } else if (cams.length) {
          const preferred = cams.find(c => /capture|blackmagic|hdmi|usb|cam ?link|atem/i.test(c.label));
          const deviceId = (preferred || cams[0]).deviceId;
          setSelectedDeviceId(deviceId);
          const stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: deviceId }, ...HD }, audio: false });
          tmp?.getTracks().forEach(t => t.stop());
          setCameraStream(stream);
        } else {
          tmp?.getTracks().forEach(t => t.stop());
        }
      } catch (err) {
        console.error('enumerate error', err);
      }
    };
    enumerate();
  }, []);

  const handleConnect = async () => {
    if (!bleAvailable) {
      return;
    }
    setConnecting(true);
    try {
      const c = await connectBlackmagic(password || undefined);
      conn.current = c;
      setConnectedName(c.name);
      c.onUpdate?.((u) => {
        // category 0 = Lens
        if (u.category === 0 && u.parameter === 2 && typeof u.value === 'number') {
          // Aperture f-stop (AV): f = 2^(av/2)
          setFStop(Math.pow(2, u.value / 2));
        } else if (u.category === 0 && u.parameter === 3 && typeof u.value === 'number') {
          // Aperture normalised 0..1
          setIris([Math.max(0, Math.min(1, u.value))]);
        } else if (u.category === 0 && u.parameter === 0 && typeof u.value === 'number') {
          setFocus([Math.max(0, Math.min(1, u.value))]);
        }
        // category 1 = Video
        else if (u.category === 1 && u.parameter === 2 && typeof u.value === 'number') {
          setWb([u.value]);
        } else if (u.category === 1 && u.parameter === 14 && typeof u.value === 'number') {
          setIso([u.value]);
        }
      });
      // Proactively request current values so sliders sync immediately.
      // Fire in parallel and retry once after a short delay to cover
      // cameras that ignore queries during the initial pairing handshake.
      const queryAll = () => Promise.allSettled([
        c.send(Commands.queryIris()),
        c.send(Commands.queryApertureAv()),
        c.send(Commands.queryFocus()),
        c.send(Commands.queryWhiteBalance()),
        c.send(Commands.queryIso()),
      ]);
      queryAll().catch(() => {});
      setTimeout(() => { queryAll().catch(() => {}); }, 300);
      setTimeout(() => { queryAll().catch(() => {}); }, 1000);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await conn.current?.disconnect();
    } finally {
      conn.current = null;
      setConnectedName(null);
      setRecording(false);
    }
  };

  const handleCameraChange = async (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    localStorage.setItem('blackmagic_camera_device_id', deviceId);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: { exact: deviceId },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 60, max: 60 },
        },
        audio: false,
      });
      setCameraStream(prev => {
        prev?.getTracks().forEach(t => t.stop());
        return stream;
      });
    } catch (err) {
      console.error('camera switch error', err);
    }
  };

  const sendOrToast = async (label: string, packet: Uint8Array) => {
    const hex = Array.from(packet).map(b => b.toString(16).padStart(2, '0')).join(' ');
    setLastPacket(`${label}: ${hex}`);
    if (!conn.current) {
      setLastError('conn.current is null');
      return;
    }
    try {
      await conn.current.send(packet);
      setLastError('');
    } catch (err: unknown) {
      console.error(label, err);
      const msg = getErrorMessage(err, 'σφάλμα');
      setLastError(msg);
    }
  };

  const toggleRecord = async () => {
    if (recording) {
      await sendOrToast('Stop record', Commands.recordStop());
      setRecording(false);
    } else {
      await sendOrToast('Start record', Commands.recordStart());
      setRecording(true);
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      </div>

      {/* Mobile sidebar overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileOpen(false)} />
          <div className="relative w-64 h-full">
            <Sidebar isCollapsed={false} setIsCollapsed={() => {}} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <div className="sticky top-0 z-40 bg-background border-b border-border p-3 lg:hidden">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setIsMobileOpen(true)} className="rounded-none">
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">Blackmagic View</h1>
          </div>
        </div>

        <main className="flex-1 p-4 lg:p-6 overflow-auto space-y-4">
          <div className="hidden lg:flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Blackmagic View</h1>
              <p className="text-sm text-muted-foreground">
                Έλεγχος κάμερας Blackmagic μέσω Bluetooth + προβολή σήματος ({platform === 'native' ? 'Native BLE' : 'Web Bluetooth'})
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="password"
                placeholder="Remote Password (αν υπάρχει)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border border-border bg-background px-3 py-1.5 text-sm rounded-none w-64"
              />
              {connectedName ? (
                <Button variant="outline" className="rounded-none" onClick={handleDisconnect}>
                  <BluetoothOff className="h-4 w-4 mr-2" />
                  Αποσύνδεση ({connectedName})
                </Button>
              ) : (
                <Button className="rounded-none" onClick={handleConnect} disabled={connecting}>
                  <Bluetooth className="h-4 w-4 mr-2" />
                  {connecting ? 'Σύνδεση...' : 'Σύνδεση Blackmagic BLE'}
                </Button>
              )}
            </div>
          </div>

          {/* Mobile connect bar */}
          <div className="flex lg:hidden flex-col gap-2">
            <input
              type="password"
              placeholder="Remote Password (αν υπάρχει)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border border-border bg-background px-3 py-1.5 text-sm rounded-none w-full"
            />
            {connectedName ? (
              <Button variant="outline" className="rounded-none w-full" onClick={handleDisconnect}>
                <BluetoothOff className="h-4 w-4 mr-2" />
                Αποσύνδεση ({connectedName})
              </Button>
            ) : (
              <Button className="rounded-none w-full" onClick={handleConnect} disabled={connecting}>
                <Bluetooth className="h-4 w-4 mr-2" />
                {connecting ? 'Σύνδεση...' : 'Σύνδεση Blackmagic BLE'}
              </Button>
            )}
          </div>

          {!bleAvailable && (
            <Card className="rounded-none p-3 border-destructive/40 bg-destructive/5 text-sm">
              Το Web Bluetooth δεν είναι διαθέσιμο σε iPad Safari/PWA. Για iPad χρησιμοποιήστε την native build
              (Capacitor): <code>npx cap sync ios &amp;&amp; npx cap run ios</code>. Σε Android/Desktop Chrome δουλεύει απευθείας.
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Camera feed */}
            <Card className="rounded-none p-3 lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <VideoIcon className="h-4 w-4" />
                  <span className="font-medium">Σήμα Κάμερας</span>
                </div>
                <select
                  className="border border-border bg-background px-2 py-1 text-sm rounded-none"
                  value={selectedDeviceId || ''}
                  onChange={(e) => handleCameraChange(e.target.value)}
                >
                  {devices.length === 0 && <option value="">— καμία —</option>}
                  {devices.map((d, i) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Κάμερα ${i + 1}`}
                    </option>
                  ))}
                </select>
              </div>
              <div className="aspect-video w-full bg-black">
                <CameraFeed deviceId={selectedDeviceId || undefined} stream={cameraStream} className="w-full h-full" />
              </div>
              <p className="text-xs text-muted-foreground">
                Συνδέστε την Blackmagic στο iPad/PC μέσω HDMI→USB capture (π.χ. ATEM Mini, Cam Link) για να εμφανίζεται εδώ.
              </p>
            </Card>

            {/* Camera controls */}
            <Card className="rounded-none p-3 space-y-4">
              <div className="font-medium flex items-center gap-2">
                <Focus className="h-4 w-4" />
                Έλεγχος Κάμερας
              </div>

              <Button
                onClick={toggleRecord}
                disabled={!connectedName}
                className="w-full rounded-none"
                variant={recording ? 'destructive' : 'default'}
              >
                {recording ? <Square className="h-4 w-4 mr-2" /> : <Circle className="h-4 w-4 mr-2 fill-current" />}
                {recording ? 'Διακοπή Εγγραφής' : 'Έναρξη Εγγραφής'}
              </Button>

              <Button
                onClick={() => sendOrToast('Autofocus', Commands.autoFocus())}
                disabled={!connectedName}
                variant="outline"
                className="w-full rounded-none"
              >
                Autofocus
              </Button>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span>Focus</span>
                  <span className="text-muted-foreground">{focus[0].toFixed(2)}</span>
                </div>
                <Slider
                  value={focus}
                  min={0}
                  max={1}
                  step={0.01}
                  onValueChange={(v) => {
                    setFocus(v);
                    if (connectedName) throttledSend('focus', 'Focus', () => Commands.focus(v[0]));
                  }}
                  onValueCommit={(v) => {
                    if (connectedName) sendOrToast('Focus', Commands.focus(v[0]));
                  }}
                  disabled={!connectedName}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span>Iris</span>
                  <span className="text-muted-foreground">
                    {fStop !== null ? `f/${fStop.toFixed(1)}` : iris[0].toFixed(2)}
                  </span>
                </div>
                <Slider
                  value={iris}
                  min={0}
                  max={1}
                  step={0.01}
                  onValueChange={(v) => {
                    setIris(v);
                    if (connectedName) throttledSend('iris', 'Iris', () => Commands.iris(v[0]));
                  }}
                  onValueCommit={(v) => {
                    if (connectedName) sendOrToast('Iris', Commands.iris(v[0]));
                  }}
                  disabled={!connectedName}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span>White Balance</span>
                  <span className="text-muted-foreground">{wb[0]}K</span>
                </div>
                <Slider
                  value={wb}
                  min={2500}
                  max={10000}
                  step={50}
                  onValueChange={(v) => {
                    const kelvin = Math.round(v[0]);
                    setWb([kelvin]);
                    if (connectedName) throttledSend('wb', `WB ${kelvin}K`, () => Commands.whiteBalance(kelvin));
                  }}
                  onValueCommit={(v) => {
                    const kelvin = Math.round(v[0]);
                    setWb([kelvin]);
                    if (connectedName) sendOrToast(`WB ${kelvin}K`, Commands.whiteBalance(kelvin));
                  }}
                />
                {connectedName && /ursa|studio/i.test(connectedName) && (
                  <Button
                    onClick={() => sendOrToast('Auto WB', Commands.autoWhiteBalance())}
                    variant="outline"
                    className="w-full rounded-none flex items-center justify-center gap-2 h-auto py-2"
                    title="Auto White Balance"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span className="text-xs font-medium">AWB</span>
                  </Button>
                )}
                <div className="grid grid-cols-6 gap-2">
                  {[
                    { k: 3200, label: 'Tungsten', Icon: Lightbulb },
                    { k: 4000, label: 'Fluorescent', Icon: Zap },
                    { k: 4500, label: 'Indoor', Icon: Home },
                    { k: 5600, label: 'Daylight', Icon: Sun },
                    { k: 6500, label: 'Cloudy', Icon: Cloud },
                    { k: 7500, label: 'Shade', Icon: CloudSun },
                  ].map(({ k, label, Icon }) => (
                    <Button
                      key={k}
                      variant="outline"
                      size="sm"
                      title={`${label} · ${k}K`}
                      aria-label={`${label} ${k}K`}
                      className="rounded-none flex flex-col items-center justify-center gap-0.5 h-auto py-1.5"
                      onClick={() => {
                        setWb([k]);
                        if (connectedName) sendOrToast(`WB ${k}K`, Commands.whiteBalance(k));
                      }}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-[10px] leading-none">{k}K</span>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span>ISO</span>
                  <span className="text-muted-foreground">{iso[0]}</span>
                </div>
                {(() => {
                  const ISO_STEPS = [
                    100, 125, 160, 200, 250, 320, 400, 500, 640, 800, 1000, 1250,
                    1600, 2000, 2500, 3200, 4000, 5000, 6400, 8000, 10000, 12800,
                    16000, 20000, 25600,
                  ];
                  const snapIso = (val: number) => {
                    return ISO_STEPS.reduce((prev, curr) =>
                      Math.abs(curr - val) < Math.abs(prev - val) ? curr : prev
                    );
                  };
                  const currentIdx = Math.max(0, ISO_STEPS.indexOf(snapIso(iso[0])));
                  return (
                    <Slider
                      value={[currentIdx]}
                      min={0}
                      max={ISO_STEPS.length - 1}
                      step={1}
                      onValueChange={(v) => {
                        const isoValue = ISO_STEPS[v[0]];
                        setIso([isoValue]);
                        if (connectedName) throttledSend('iso', `ISO ${isoValue}`, () => Commands.iso(isoValue), 120);
                      }}
                      onValueCommit={(v) => {
                        const isoValue = ISO_STEPS[v[0]];
                        setIso([isoValue]);
                        if (connectedName) sendOrToast(`ISO ${isoValue}`, Commands.iso(isoValue));
                      }}
                    />
                  );
                })()}
                {(() => {
                  const ISO_STEPS = [
                    100, 125, 160, 200, 250, 320, 400, 500, 640, 800, 1000, 1250,
                    1600, 2000, 2500, 3200, 4000, 5000, 6400, 8000, 10000, 12800,
                    16000, 20000, 25600,
                  ];
                  const getNativeIsos = (name: string | null): number[] => {
                    const n = (name || '').toLowerCase();
                    if (/ursa.*(mini pro)?\s*12k|pyxis\s*12k/.test(n)) return [800, 3200];
                    if (/studio|broadcast/.test(n)) return [400];
                    // Pocket 4K/6K, Cinema 6K, URSA 4.6K G2, Pyxis 6K, default
                    return [400, 3200];
                  };
                  const natives = getNativeIsos(connectedName);
                  const buttons: { label: string; value: number }[] = [];
                  natives.forEach((nv, i) => {
                    const idx = ISO_STEPS.indexOf(nv);
                    const below = idx > 0 ? ISO_STEPS[idx - 1] : null;
                    const above = idx >= 0 && idx < ISO_STEPS.length - 1 ? ISO_STEPS[idx + 1] : null;
                    if (below !== null) buttons.push({ label: `${below}`, value: below });
                    buttons.push({ label: `${nv}★`, value: nv });
                    if (above !== null) buttons.push({ label: `${above}`, value: above });
                  });
                  return (
                    <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${buttons.length}, minmax(0, 1fr))` }}>
                      {buttons.map((b, i) => (
                        <Button
                          key={`${b.value}-${i}`}
                          variant="outline"
                          size="sm"
                          className="rounded-none text-xs px-1"
                          onClick={() => {
                            setIso([b.value]);
                            if (connectedName) sendOrToast(`ISO ${b.value}`, Commands.iso(b.value));
                          }}
                        >
                          {b.label}
                        </Button>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </Card>
          </div>

        </main>
      </div>
    </div>
  );
};

export default BlackmagicViewPage;
