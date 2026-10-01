import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { HeartPulse, Bluetooth, BluetoothOff, Menu, RotateCcw } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { CoachSidebar } from '@/components/CoachSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useRoleCheck } from '@/hooks/useRoleCheck';
import { toast } from 'sonner';

interface Sample { t: number; bpm: number; }

const parseHeartRate = (value: DataView) => {
  const flags = value.getUint8(0);
  const is16 = flags & 0x01;
  let offset = 1;
  const bpm = is16 ? value.getUint16(offset, true) : value.getUint8(offset);
  offset += is16 ? 2 : 1;
  if (flags & 0x08) offset += 2; // energy expended
  const rr: number[] = [];
  if (flags & 0x10) {
    for (; offset + 1 < value.byteLength; offset += 2) {
      rr.push((value.getUint16(offset, true) / 1024) * 1000);
    }
  }
  return { bpm, rr };
};

const HeartRatePage = () => {
  const { isAdmin } = useRoleCheck();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [bpm, setBpm] = useState<number | null>(null);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [rrList, setRrList] = useState<number[]>([]);
  const deviceRef = useRef<any>(null);
  const startRef = useRef<number>(0);
  const [maxHrSetting, setMaxHrSetting] = useState('200');

  const supported = typeof navigator !== 'undefined' && 'bluetooth' in navigator;

  const onValue = (e: any) => {
    const { bpm, rr } = parseHeartRate(e.target.value as DataView);
    setBpm(bpm);
    setSamples(prev => [...prev.slice(-299), { t: Date.now() - startRef.current, bpm }]);
    if (rr.length) setRrList(prev => [...prev.slice(-300), ...rr]);
  };

  const connect = async () => {
    try {
      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [{ services: ['heart_rate'] }],
      });
      deviceRef.current = device;
      device.addEventListener('gattserverdisconnected', () => {
        setConnected(false);
        toast.info('Η συσκευή αποσυνδέθηκε');
      });
      const server = await device.gatt.connect();
      const service = await server.getPrimaryService('heart_rate');
      const ch = await service.getCharacteristic('heart_rate_measurement');
      await ch.startNotifications();
      ch.addEventListener('characteristicvaluechanged', onValue);
      startRef.current = Date.now();
      setDeviceName(device.name || 'Συσκευή HR');
      setConnected(true);
      toast.success('Συνδέθηκε');
    } catch (err: any) {
      if (err?.name !== 'NotFoundError') toast.error('Αποτυχία σύνδεσης: ' + (err?.message || ''));
    }
  };

  const disconnect = () => {
    deviceRef.current?.gatt?.disconnect();
    setConnected(false);
  };

  useEffect(() => () => deviceRef.current?.gatt?.disconnect(), []);

  const reset = () => { setSamples([]); setRrList([]); startRef.current = Date.now(); };

  const values = samples.map(s => s.bpm);
  const avg = values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : null;
  const max = values.length ? Math.max(...values) : null;
  const min = values.length ? Math.min(...values) : null;
  const rmssd = rrList.length > 2
    ? Math.round(Math.sqrt(rrList.slice(1).reduce((acc, v, i) => acc + (v - rrList[i]) ** 2, 0) / (rrList.length - 1)))
    : null;

  // Chart
  const W = 600, H = 160;
  const maxHr = Math.max(100, Number(maxHrSetting) || 200);
  const chartMin = Math.min(min !== null ? min - 5 : 40, maxHr * 0.45);
  const chartMax = Math.max(max !== null ? max + 5 : 200, maxHr);
  const yFor = (bpm: number) => H - ((bpm - chartMin) / Math.max(1, chartMax - chartMin)) * H;
  const zones = [
    { name: 'Z1', range: '50-60%', from: 0.5, to: 0.6, color: '#9ca3af' },
    { name: 'Z2', range: '60-70%', from: 0.6, to: 0.7, color: '#3b82f6' },
    { name: 'Z3', range: '70-80%', from: 0.7, to: 0.8, color: '#22c55e' },
    { name: 'Z4', range: '80-90%', from: 0.8, to: 0.9, color: '#eab308' },
    { name: 'Z5', range: '90-100%', from: 0.9, to: 1.0, color: '#ef4444' },
  ];
  const points = samples.map((s, i) => {
    const x = samples.length > 1 ? (i / (samples.length - 1)) * W : 0;
    return `${x},${yFor(s.bpm)}`;
  }).join(' ');

  const renderSidebar = () => isAdmin()
    ? <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
    : <CoachSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <div className="hidden lg:block">{renderSidebar()}</div>
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileOpen(false)} />
            <div className="relative w-64 h-full">{renderSidebar()}</div>
          </div>
        )}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="sticky top-0 z-40 bg-background border-b border-border p-3 lg:hidden">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => setIsMobileOpen(true)} className="rounded-none">
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-lg font-semibold">Heart Rate (HR+)</h1>
            </div>
          </div>

          <main className="flex-1 p-4 lg:p-6 overflow-auto space-y-4">
            <div className="hidden lg:flex items-center gap-2">
              <HeartPulse className="h-6 w-6" />
              <h1 className="text-2xl font-bold">Heart Rate (HR+)</h1>
            </div>

            {!supported && (
              <Card className="rounded-none border-destructive">
                <CardContent className="p-4 text-sm">
                  Ο browser δεν υποστηρίζει Bluetooth. Χρησιμοποίησε Chrome ή Edge σε υπολογιστή ή Android. Στο iPhone (Safari) δεν λειτουργεί.
                </CardContent>
              </Card>
            )}

            <Card className="rounded-none">
              <CardContent className="p-4 flex flex-wrap items-center gap-3">
                {!connected ? (
                  <Button onClick={connect} disabled={!supported} className="rounded-none">
                    <Bluetooth className="h-4 w-4 mr-2" /> Σύνδεση συσκευής
                  </Button>
                ) : (
                  <Button variant="outline" onClick={disconnect} className="rounded-none">
                    <BluetoothOff className="h-4 w-4 mr-2" /> Αποσύνδεση
                  </Button>
                )}
                <Button variant="outline" onClick={reset} className="rounded-none">
                  <RotateCcw className="h-4 w-4 mr-2" /> Μηδενισμός
                </Button>
                <span className="text-sm text-muted-foreground">
                  {connected ? `Συνδεδεμένο: ${deviceName}` : 'Καμία συσκευή'}
                </span>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <Card className="rounded-none col-span-2 md:col-span-1">
                <CardContent className="p-4 text-center">
                  <HeartPulse className={`h-8 w-8 mx-auto ${connected ? 'animate-pulse text-destructive' : 'text-muted-foreground'}`} />
                  <div className="text-5xl font-bold">{bpm ?? '--'}</div>
                  <div className="text-xs text-muted-foreground">BPM</div>
                </CardContent>
              </Card>
              {[['Μέσος', avg], ['Max', max], ['Min', min], ['RMSSD (ms)', rmssd]].map(([l, v]) => (
                <Card key={l as string} className="rounded-none">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-semibold">{v ?? '--'}</div>
                    <div className="text-xs text-muted-foreground">{l}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="rounded-none">
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm">Γράφημα παλμών & ζώνες</CardTitle>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Max HR:</span>
                  <Input
                    type="number"
                    value={maxHrSetting}
                    onChange={(e) => setMaxHrSetting(e.target.value)}
                    className="rounded-none h-7 w-20 text-xs"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-40" preserveAspectRatio="none">
                  {zones.map(z => {
                    const yTop = Math.max(0, yFor(maxHr * z.to));
                    const yBottom = Math.min(H, yFor(maxHr * z.from));
                    const bandH = yBottom - yTop;
                    if (bandH <= 0) return null;
                    return (
                      <g key={z.name}>
                        <rect x={0} y={yTop} width={W} height={bandH} fill={z.color} opacity={0.18} />
                        <text x={W - 4} y={yTop + 11} textAnchor="end" fontSize={9} fontWeight="bold" fill={z.color}>
                          {z.name}
                        </text>
                      </g>
                    );
                  })}
                  {samples.length > 1 && (
                    <polyline points={points} fill="none" stroke="hsl(var(--foreground))" strokeWidth="2" />
                  )}
                </svg>
                <div className="flex flex-wrap items-center gap-3 mt-1">
                  {zones.map(z => (
                    <span key={z.name} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <span className="inline-block w-2.5 h-2.5" style={{ backgroundColor: z.color }} />
                      {z.name} ({z.range})
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default HeartRatePage;
