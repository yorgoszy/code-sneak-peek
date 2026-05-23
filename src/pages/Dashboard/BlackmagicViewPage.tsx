import React, { useEffect, useRef, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { Menu, Bluetooth, BluetoothOff, Video as VideoIcon, Circle, Square, Focus } from 'lucide-react';
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
  const [wb, setWb] = useState([5600]);
  const [iso, setIso] = useState([400]);
  const [lastPacket, setLastPacket] = useState<string>('');
  const [lastError, setLastError] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const platform = detectPlatform();
  const bleAvailable = isBluetoothAvailable();

  useEffect(() => () => {
    cameraStream?.getTracks().forEach(t => t.stop());
  }, [cameraStream]);

  // Enumerate cameras (need permission first)
  useEffect(() => {
    const enumerate = async () => {
      try {
        // Trigger permission once and keep this stream alive so the HDMI/capture preview does not blink.
        const tmp = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        const all = await navigator.mediaDevices.enumerateDevices();
        const cams = all.filter(d => d.kind === 'videoinput');
        setDevices(cams);
        // Only auto-select if no remembered choice OR the remembered device is gone
        const saved = localStorage.getItem('blackmagic_camera_device_id');
        const savedExists = saved && cams.some(c => c.deviceId === saved);
        if (savedExists) {
          setSelectedDeviceId(saved!);
          const stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: saved! } }, audio: false });
          tmp.getTracks().forEach(t => t.stop());
          setCameraStream(stream);
        } else if (cams.length) {
          // Prefer a camera whose label mentions capture/blackmagic/hdmi/usb if any
          const preferred = cams.find(c => /capture|blackmagic|hdmi|usb|cam ?link|atem/i.test(c.label));
          const deviceId = (preferred || cams[0]).deviceId;
          setSelectedDeviceId(deviceId);
          if (preferred) {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: deviceId } }, audio: false });
            tmp.getTracks().forEach(t => t.stop());
            setCameraStream(stream);
          } else {
            setCameraStream(tmp);
          }
        } else {
          tmp.getTracks().forEach(t => t.stop());
        }
      } catch (err) {
        console.error('enumerate error', err);
        toast.error('Δεν βρέθηκαν κάμερες ή δεν δόθηκε άδεια');
      }
    };
    enumerate();
  }, []);

  const handleConnect = async () => {
    if (!bleAvailable) {
      toast.error(
        platform === 'web'
          ? 'Το Web Bluetooth δεν υποστηρίζεται σε αυτόν τον browser. Χρησιμοποιήστε Chrome σε Android/Desktop ή την native build.'
          : 'BLE δεν είναι διαθέσιμο'
      );
      return;
    }
    setConnecting(true);
    try {
      const c = await connectBlackmagic(password || undefined);
      conn.current = c;
      setConnectedName(c.name);
      toast.success(`Συνδέθηκε με ${c.name}`);
    } catch (err: unknown) {
      console.error(err);
      toast.error(getErrorMessage(err, 'Αποτυχία σύνδεσης BLE'));
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
      const stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: deviceId } }, audio: false });
      setCameraStream(prev => {
        prev?.getTracks().forEach(t => t.stop());
        return stream;
      });
    } catch (err) {
      console.error('camera switch error', err);
      toast.error('Δεν άνοιξε το επιλεγμένο σήμα κάμερας');
    }
  };

  const sendOrToast = async (label: string, packet: Uint8Array) => {
    const hex = Array.from(packet).map(b => b.toString(16).padStart(2, '0')).join(' ');
    setLastPacket(`${label}: ${hex}`);
    if (!conn.current) {
      toast.error('Δεν υπάρχει σύνδεση με κάμερα');
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
      toast.error(`${label}: ${msg}`);
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
                    if (connectedName) sendOrToast('Focus', Commands.focus(v[0]));
                  }}
                  disabled={!connectedName}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span>Iris</span>
                  <span className="text-muted-foreground">{iris[0].toFixed(2)}</span>
                </div>
                <Slider
                  value={iris}
                  min={0}
                  max={1}
                  step={0.01}
                  onValueChange={(v) => {
                    setIris(v);
                    if (connectedName) sendOrToast('Iris', Commands.iris(v[0]));
                  }}
                  disabled={!connectedName}
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[3200, 4600, 5600].map((k) => (
                  <Button
                    key={k}
                    variant="outline"
                    className="rounded-none text-xs"
                    disabled={!connectedName}
                    onClick={() => sendOrToast(`WB ${k}K`, Commands.whiteBalance(k))}
                  >
                    {k}K
                  </Button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[400, 800, 1600].map((iso) => (
                  <Button
                    key={iso}
                    variant="outline"
                    className="rounded-none text-xs"
                    disabled={!connectedName}
                    onClick={() => sendOrToast(`ISO ${iso}`, Commands.iso(iso))}
                  >
                    ISO {iso}
                  </Button>
                ))}
              </div>
            </Card>
          </div>

          <Card className="rounded-none p-3 font-mono text-xs space-y-1 bg-muted/40">
            <div className="font-semibold text-sm">Debug</div>
            <div>BLE: <span className={connectedName ? 'text-green-500' : 'text-red-500'}>{connectedName || 'Αποσύνδετο'}</span></div>
            <div>Κωδικός κάμερας: <span className="break-all">{password ? '•'.repeat(password.length) + ` (${password.length} χαρ.)` : '— (κενό)'}</span></div>
            <div>Packet: <span className="break-all">{lastPacket || '—'}</span></div>
            <div>Error: <span className="text-red-500">{lastError || '—'}</span></div>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default BlackmagicViewPage;
