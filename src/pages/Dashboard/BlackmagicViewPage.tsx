import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { BlueSlider }  from '@/components/ui/blue-slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { QRCodeSVG } from 'qrcode.react';
import { Menu, Bluetooth, BluetoothOff, Video as VideoIcon, Circle, Square, Focus, Sun, Cloud, CloudSun, Lightbulb, Zap, Home, RefreshCw, Maximize2, Minimize2, Aperture, Thermometer, Gauge, Smartphone, X, Share2, Copy, Check } from 'lucide-react';
import { CameraFeed } from '@/components/federation/CameraFeed';
import {
  connectBlackmagic,
  Commands,
  isBluetoothAvailable,
  detectPlatform,
  type BmdConnection,
} from '@/lib/blackmagicBle';
import { startHostSession, generateSessionId, type HostSession, type RemoteCommand } from '@/lib/blackmagicRemoteSession';

const getErrorMessage = (error: unknown, fallback: string) => (
  error instanceof Error && error.message ? error.message : fallback
);

const BlackmagicViewPage: React.FC = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');

  const handleJoinSession = () => {
    const code = joinCode.trim();
    if (/^\d{4}$/.test(code)) {
      navigate(`/remote-camera/${code}`);
    }
  };

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

  // Fullscreen / overlay UI
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeControl, setActiveControl] = useState<null | 'focus' | 'iris' | 'wb' | 'iso'>(null);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mqSmall = window.matchMedia('(max-width: 1023px)');
    const mqPortrait = window.matchMedia('(orientation: portrait)');
    const upd = () => {
      setIsSmallScreen(mqSmall.matches);
      setIsPortrait(mqPortrait.matches);
    };
    upd();
    mqSmall.addEventListener('change', upd);
    mqPortrait.addEventListener('change', upd);
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => {
      mqSmall.removeEventListener('change', upd);
      mqPortrait.removeEventListener('change', upd);
      document.removeEventListener('fullscreenchange', onFs);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await (containerRef.current || document.documentElement).requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn('fullscreen error', err);
    }
  };


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
          width: { ideal: 1280 },
          height: { ideal: 720 },
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
          width: { ideal: 1280 },
          height: { ideal: 720 },
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

  // ── Remote Share Session (QR) ──
  const [shareOpen, setShareOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [linkCopied, setLinkCopied] = useState(false);
  const hostSessionRef = useRef<HostSession | null>(null);

  // Latest values refs so host callbacks always see fresh data
  const stateRef = useRef({ recording, focus: focus[0], iris: iris[0], wb: wb[0], iso: iso[0] });
  useEffect(() => {
    stateRef.current = { recording, focus: focus[0], iris: iris[0], wb: wb[0], iso: iso[0] };
    hostSessionRef.current?.pushState();
  }, [recording, focus, iris, wb, iso]);

  const cameraStreamRef = useRef<MediaStream | null>(null);
  useEffect(() => { cameraStreamRef.current = cameraStream; }, [cameraStream]);

  const handleRemoteCommand = useCallback((cmd: RemoteCommand) => {
    switch (cmd.type) {
      case 'record': {
        const cur = stateRef.current.recording;
        if (cmd.value && !cur) {
          sendOrToast('Start record', Commands.recordStart());
          setRecording(true);
        } else if (!cmd.value && cur) {
          sendOrToast('Stop record', Commands.recordStop());
          setRecording(false);
        }
        break;
      }
      case 'autofocus':
        sendOrToast('Autofocus', Commands.autoFocus());
        break;
      case 'autowb':
        sendOrToast('Auto WB', Commands.autoWhiteBalance());
        break;
      case 'focus':
        setFocus([cmd.value]);
        if (connectedName) sendOrToast('Focus', Commands.focus(cmd.value));
        break;
      case 'iris':
        setIris([cmd.value]);
        if (connectedName) sendOrToast('Iris', Commands.iris(cmd.value));
        break;
      case 'wb':
        setWb([cmd.value]);
        if (connectedName) sendOrToast(`WB ${cmd.value}K`, Commands.whiteBalance(cmd.value));
        break;
      case 'iso':
        setIso([cmd.value]);
        if (connectedName) sendOrToast(`ISO ${cmd.value}`, Commands.iso(cmd.value));
        break;
    }
  }, [connectedName]);

  const startSharing = () => {
    let sid = sessionId;
    if (!sid) {
      sid = generateSessionId();
      setSessionId(sid);
    }
    if (!hostSessionRef.current) {
      hostSessionRef.current = startHostSession({
        sessionId: sid,
        getStream: () => cameraStreamRef.current,
        getState: () => ({
          connected: true,
          recording: stateRef.current.recording,
          focus: stateRef.current.focus,
          iris: stateRef.current.iris,
          wb: stateRef.current.wb,
          iso: stateRef.current.iso,
        }),
        onCommand: handleRemoteCommand,
        onViewerChange: setViewerCount,
      });
    }
    setShareOpen(true);
  };

  const stopSharing = () => {
    try { hostSessionRef.current?.close(); } catch {}
    hostSessionRef.current = null;
    setSessionId(null);
    setViewerCount(0);
    setShareOpen(false);
  };

  useEffect(() => () => { try { hostSessionRef.current?.close(); } catch {} }, []);

  const remoteUrl = sessionId
    ? `${window.location.origin}/remote-camera/${sessionId}`
    : '';

  const copyRemoteLink = async () => {
    if (!remoteUrl) return;
    try {
      await navigator.clipboard.writeText(remoteUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 1500);
    } catch {}
  };


  // ── ISO helpers ──
  const ISO_STEPS = [
    100, 125, 160, 200, 250, 320, 400, 500, 640, 800, 1000, 1250,
    1600, 2000, 2500, 3200, 4000, 5000, 6400, 8000, 10000, 12800,
    16000, 20000, 25600,
  ];
  const snapIso = (val: number) =>
    ISO_STEPS.reduce((prev, curr) => (Math.abs(curr - val) < Math.abs(prev - val) ? curr : prev));
  const getNativeIsos = (name: string | null): number[] => {
    const n = (name || '').toLowerCase();
    if (/ursa.*(mini pro)?\s*12k|pyxis\s*12k/.test(n)) return [800, 3200];
    if (/studio|broadcast/.test(n)) return [400];
    return [400, 3200];
  };
  const nativeIsoButtons = (() => {
    const natives = getNativeIsos(connectedName);
    const buttons: { label: string; value: number }[] = [];
    natives.forEach((nv) => {
      const idx = ISO_STEPS.indexOf(nv);
      const below = idx > 0 ? ISO_STEPS[idx - 1] : null;
      const above = idx >= 0 && idx < ISO_STEPS.length - 1 ? ISO_STEPS[idx + 1] : null;
      if (below !== null) buttons.push({ label: `${below}`, value: below });
      buttons.push({ label: `${nv}★`, value: nv });
      if (above !== null) buttons.push({ label: `${above}`, value: above });
    });
    return buttons;
  })();

  const immersive = isSmallScreen || isFullscreen;

  // ── Slider panels (rendered inside overlay popover) ──
  const renderSliderPanel = () => {
    if (!activeControl) return null;
    const panelBase = 'p-4 rounded-none text-white';
    if (activeControl === 'focus') {
      return (
        <div className={panelBase}>
          <div className="flex items-center justify-between text-xs mb-2">
            <span>Focus</span>
            <span className="opacity-70">{focus[0].toFixed(2)}</span>
          </div>
          <BlueSlider
            value={focus}
            min={0}
            max={1}
            step={0.01}
            onValueChange={(v) => {
              setFocus(v);
              if (connectedName) throttledSend('focus', 'Focus', () => Commands.focus(v[0]));
            }}
            onValueCommit={(v) => { if (connectedName) sendOrToast('Focus', Commands.focus(v[0])); }}
            disabled={!connectedName}
          />
        </div>
      );
    }
    if (activeControl === 'iris') {
      return (
        <div className={panelBase}>
          <div className="flex items-center justify-between text-xs mb-2">
            <span>Iris</span>
            <span className="opacity-70">{fStop !== null ? `f/${fStop.toFixed(1)}` : iris[0].toFixed(2)}</span>
          </div>
          <BlueSlider
            value={iris}
            min={0}
            max={1}
            step={0.01}
            onValueChange={(v) => {
              setIris(v);
              if (connectedName) throttledSend('iris', 'Iris', () => Commands.iris(v[0]));
            }}
            onValueCommit={(v) => { if (connectedName) sendOrToast('Iris', Commands.iris(v[0])); }}
            disabled={!connectedName}
          />
        </div>
      );
    }
    if (activeControl === 'wb') {
      return (
        <div className={panelBase}>
          <div className="flex items-center justify-between text-xs mb-2">
            <span>White Balance</span>
            <span className="opacity-70">{wb[0]}K</span>
          </div>
          <BlueSlider
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
          <div className="grid grid-cols-6 gap-1 mt-3">
            {[
              { k: 3200, label: 'Tungsten', Icon: Lightbulb },
              { k: 4000, label: 'Fluor.', Icon: Zap },
              { k: 4500, label: 'Indoor', Icon: Home },
              { k: 5600, label: 'Day', Icon: Sun },
              { k: 6500, label: 'Cloudy', Icon: Cloud },
              { k: 7500, label: 'Shade', Icon: CloudSun },
            ].map(({ k, label, Icon }) => (
              <Button
                key={k}
                variant="outline"
                size="sm"
                title={`${label} · ${k}K`}
                className="rounded-none flex flex-col items-center justify-center gap-0.5 h-auto py-1.5 bg-white/10 border-white/30 text-white hover:bg-white/20"
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
          {connectedName && /ursa|studio/i.test(connectedName) && (
            <Button
              onClick={() => sendOrToast('Auto WB', Commands.autoWhiteBalance())}
              variant="outline"
              className="w-full rounded-none mt-2 bg-white/10 border-white/30 text-white hover:bg-white/20"
            >
              <RefreshCw className="h-4 w-4 mr-2" /> AWB
            </Button>
          )}
        </div>
      );
    }
    if (activeControl === 'iso') {
      const currentIdx = Math.max(0, ISO_STEPS.indexOf(snapIso(iso[0])));
      return (
        <div className={panelBase}>
          <div className="flex items-center justify-between text-xs mb-2">
            <span>ISO</span>
            <span className="opacity-70">{iso[0]}</span>
          </div>
          <BlueSlider
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
          {nativeIsoButtons.length > 0 && (
            <div
              className="grid gap-1 mt-3"
              style={{ gridTemplateColumns: `repeat(${nativeIsoButtons.length}, minmax(0, 1fr))` }}
            >
              {nativeIsoButtons.map((b, i) => (
                <Button
                  key={`${b.value}-${i}`}
                  variant="outline"
                  size="sm"
                  className="rounded-none text-xs px-1 bg-white/10 border-white/30 text-white hover:bg-white/20"
                  onClick={() => {
                    setIso([b.value]);
                    if (connectedName) sendOrToast(`ISO ${b.value}`, Commands.iso(b.value));
                  }}
                >
                  {b.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // ── Overlay (in-video) controls ──
  const overlayButton = (key: typeof activeControl, Icon: React.ComponentType<{ className?: string }>, label: string, value: string) => (
    <button
      type="button"
      onClick={() => setActiveControl((prev) => (prev === key ? null : key))}
      className={`flex flex-col items-center justify-center gap-1 px-2 py-1 min-w-[44px] text-white ${activeControl === key ? 'bg-white/20' : 'hover:bg-white/10'}`}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="text-[9px] leading-none uppercase tracking-wide">{label}</span>
      <span className="text-[9px] leading-none opacity-80">{value}</span>
    </button>
  );

  const renderOverlay = () => (
    <>
      {/* Click-catcher to toggle controls (REC area excluded via stopPropagation) */}
      <div
        className="absolute inset-0 z-10"
        onClick={() => {
          setControlsVisible((v) => !v);
          setActiveControl(null);
        }}
      />

      {/* TOP: all controls in one row at the very top */}
      <div
        className={`absolute top-1 left-2 right-2 z-20 flex items-start justify-between gap-2 pointer-events-none transition-opacity duration-200 ${controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <div className="flex items-center gap-1 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
          {devices.length > 0 && (
            <select
              className="bg-transparent text-white px-2 py-1 text-xs rounded-none max-w-[160px]"
              value={selectedDeviceId || ''}
              onChange={(e) => handleCameraChange(e.target.value)}
            >
              {devices.map((d, i) => (
                <option key={d.deviceId} value={d.deviceId} className="text-black">
                  {d.label || `Cam ${i + 1}`}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center gap-1 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
          {overlayButton('focus', Focus, 'Focus', focus[0].toFixed(2))}
          <button
            type="button"
            onClick={() => sendOrToast('Autofocus', Commands.autoFocus())}
            disabled={!connectedName}
            className="flex flex-col items-center justify-center gap-1 px-2 py-1 min-w-[44px] text-white hover:bg-white/10 disabled:opacity-40"
          >
            <Focus className="h-3.5 w-3.5" />
            <span className="text-[9px] leading-none uppercase tracking-wide">Auto</span>
            <span className="text-[9px] leading-none opacity-80">Focus</span>
          </button>
          {overlayButton('iris', Aperture, 'Iris', fStop !== null ? `f/${fStop.toFixed(1)}` : iris[0].toFixed(2))}
          {overlayButton('wb', Thermometer, 'WB', `${wb[0]}K`)}
          {overlayButton('iso', Gauge, 'ISO', `${iso[0]}`)}
          <Button
            size="sm"
            variant="outline"
            className="rounded-none bg-transparent text-white hover:bg-white/10 border-1 border-white/10"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Slider popover (appears below top controls when active) */}
      {activeControl && controlsVisible && (
        <div className="absolute left-1/2 -translate-x-1/2 top-14 z-20 w-[92%] max-w-xl pointer-events-auto" onClick={(e) => e.stopPropagation()}>
          {renderSliderPanel()}
        </div>
      )}

      {/* BOTTOM: REC only, always visible */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={toggleRecord}
          disabled={!connectedName}
          aria-label={recording ? 'Stop recording' : 'Start recording'}
          className="flex items-center justify-center w-14 h-14 hover:bg-white/10 disabled:opacity-40"
        >
          {recording ? (
            <span className="block w-5 h-5 bg-red-600" />
          ) : (
            <span className="block w-8 h-8 rounded-full bg-red-600" />
          )}
        </button>
      </div>

      {/* Portrait rotate hint (mobile/tablet only) */}
      {isSmallScreen && isPortrait && (
        <div className="absolute inset-0 z-40 bg-black/95 flex flex-col items-center justify-center text-white px-6 text-center">
          <Smartphone className="h-16 w-16 mb-4 animate-pulse rotate-90" />
          <p className="text-lg font-semibold mb-1">Γύρισε τη συσκευή σου</p>
          <p className="text-sm opacity-70">Τα χειριστήρια εμφανίζονται οριζόντια</p>
          {!isFullscreen && (
            <Button
              size="sm"
              variant="outline"
              className="mt-6 rounded-none bg-white/10 border-white/30 text-white"
              onClick={() => { window.history.back(); }}
            >
              <X className="h-4 w-4 mr-1" /> Έξοδος
            </Button>
          )}
        </div>
      )}
    </>
  );


  // ── IMMERSIVE FULLSCREEN MODE (mobile/tablet always, desktop on fullscreen) ──
  if (immersive) {
    return (
      <div ref={containerRef} className="fixed inset-0 z-50 bg-black overflow-hidden">
        <CameraFeed
          deviceId={selectedDeviceId || undefined}
          stream={cameraStream}
          className="absolute inset-0 w-full h-full object-contain"
        />
        {renderOverlay()}
      </div>
    );
  }

  // ── DESKTOP DASHBOARD MODE ──
  return (
    <div className="min-h-screen flex w-full bg-background">
      <div className="hidden lg:block">
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      </div>

      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileOpen(false)} />
          <div className="relative w-64 h-full">
            <Sidebar isCollapsed={false} setIsCollapsed={() => {}} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <div className="sticky top-0 z-40 bg-background border-b border-border p-3 lg:hidden">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setIsMobileOpen(true)} className="rounded-none">
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">Blackmagic View</h1>
          </div>
        </div>

        <main className="flex-1 p-4 lg:p-6 overflow-auto space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h1 className="text-2xl font-bold">Blackmagic View</h1>
              <p className="text-sm text-muted-foreground">
                Έλεγχος Blackmagic μέσω Bluetooth ({platform === 'native' ? 'Native BLE' : 'Web Bluetooth'})
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="password"
                placeholder="Remote Password (αν υπάρχει)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border border-border bg-background px-3 py-1.5 text-sm rounded-none w-56"
              />
              {connectedName ? (
                <Button variant="outline" className="rounded-none" onClick={handleDisconnect}>
                  <BluetoothOff className="h-4 w-4 mr-2" />
                  {connectedName}
                </Button>
              ) : (
                <Button className="rounded-none" onClick={handleConnect} disabled={connecting || !bleAvailable}>
                  <Bluetooth className="h-4 w-4 mr-2" />
                  {connecting ? 'Σύνδεση...' : 'Σύνδεση BLE'}
                </Button>
              )}
              <Button
                variant={hostSessionRef.current ? 'default' : 'outline'}
                className="rounded-none"
                onClick={hostSessionRef.current ? () => setShareOpen(true) : startSharing}
                disabled={!cameraStream}
                title={!cameraStream ? 'Επίλεξε πρώτα κάμερα' : 'Απομακρυσμένη προβολή με QR'}
              >
                <Share2 className="h-4 w-4 mr-2" />
                {hostSessionRef.current
                  ? `Share (${viewerCount})`
                  : 'Share'}
              </Button>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  placeholder="Κωδικός"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleJoinSession(); }}
                  className="border border-border bg-background px-3 py-1.5 text-sm rounded-none w-24 text-center tracking-widest"
                />
                <Button
                  variant="outline"
                  className="rounded-none"
                  onClick={handleJoinSession}
                  disabled={joinCode.length !== 4}
                  title="Σύνδεση σε υπάρχουσα συνεδρία"
                >
                  Join
                </Button>
              </div>
              <Button variant="outline" className="rounded-none" onClick={toggleFullscreen}>
                <Maximize2 className="h-4 w-4 mr-2" />
                Fullscreen
              </Button>
            </div>
          </div>

          {!bleAvailable && (
            <Card className="rounded-none p-3 border-destructive/40 bg-destructive/5 text-sm">
              Το Web Bluetooth δεν είναι διαθέσιμο σε iPad Safari/PWA. Για iPad χρησιμοποιήστε την native build.
            </Card>
          )}

          <Card className="rounded-none p-3 space-y-3">
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
            <div className="relative w-full bg-black" style={{ aspectRatio: '16 / 9' }}>
              <CameraFeed deviceId={selectedDeviceId || undefined} stream={cameraStream} className="w-full h-full" />
              {renderOverlay()}
            </div>
            <p className="text-xs text-muted-foreground">
              Πάτα το κουμπί Fullscreen ή κάθε χειριστήριο για να εμφανιστεί το slider.
            </p>
          </Card>
        </main>
      </div>

      <Dialog open={shareOpen} onOpenChange={(o) => !o && setShareOpen(false)}>
        <DialogContent className="rounded-none max-w-sm">
          <DialogHeader>
            <DialogTitle>Απομακρυσμένη Προβολή</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Σκάναρε το QR με άλλη συσκευή για live view και έλεγχο της κάμερας.
            </p>
            {remoteUrl && (
              <div className="flex flex-col items-center gap-3">
                <div className="bg-white p-3 rounded-none border border-border">
                  <QRCodeSVG value={remoteUrl} size={220} />
                </div>
                <div className="flex w-full gap-2">
                  <input
                    readOnly
                    value={remoteUrl}
                    className="flex-1 border border-border bg-background px-2 py-1.5 text-xs rounded-none"
                  />
                  <Button variant="outline" size="sm" className="rounded-none" onClick={copyRemoteLink}>
                    {linkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
                  <span>Θεατές: <strong className="text-foreground">{viewerCount}</strong></span>
                  <span>Session: {sessionId}</span>
                </div>
              </div>
            )}
            <Button variant="outline" className="w-full rounded-none" onClick={stopSharing}>
              Τερματισμός συνεδρίας
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BlackmagicViewPage;

