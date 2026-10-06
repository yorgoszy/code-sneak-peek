import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { HeartPulse, Bluetooth, BluetoothOff, Menu, RotateCcw, Play, Square } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
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
  const { isAdmin, userProfile } = useRoleCheck();
  const [recording, setRecording] = useState(false);
  const [saving, setSaving] = useState(false);
  const recStartRef = useRef<Date | null>(null);
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
  const maxHrTouchedRef = useRef(false);
  const [maxHrAuto, setMaxHrAuto] = useState<number | null>(null);

  // Αυτόματο Max HR από την ηλικία: 220 - (ηλικία × 0.33)
  useEffect(() => {
    if (!userProfile?.birth_date) return;
    const b = new Date(userProfile.birth_date);
    if (isNaN(b.getTime())) return;
    const today = new Date();
    let age = today.getFullYear() - b.getFullYear();
    const m = today.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < b.getDate())) age--;
    if (age < 0 || age > 120) return;
    const auto = Math.round(220 - age * 0.33);
    setMaxHrAuto(auto);
    if (!maxHrTouchedRef.current) setMaxHrSetting(String(auto));
  }, [userProfile?.birth_date]);

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

  const startRecording = () => {
    setSamples([]); setRrList([]); startRef.current = Date.now();
    recStartRef.current = new Date(); setRecording(true);
    toast.success('Η καταγραφή ξεκίνησε');
  };

  const stopRecording = async () => {
    if (!recStartRef.current) return;
    if (!userProfile?.id) { toast.error('Δεν βρέθηκε συνδεδεμένος χρήστης'); return; }
    setRecording(false); setSaving(true);
    const end = new Date();
    const { error } = await supabase.from('heart_rate_sessions' as any).insert({
      user_id: userProfile.id,
      device_name: deviceName,
      started_at: recStartRef.current.toISOString(),
      ended_at: end.toISOString(),
      duration_seconds: Math.round((end.getTime() - recStartRef.current.getTime()) / 1000),
      avg_bpm: avg, max_bpm: max, min_bpm: min, rmssd,
      max_hr_setting: Number(maxHrSetting) || null,
      samples, rr_intervals: rrList.map(r => Math.round(r)),
    });
    setSaving(false); recStartRef.current = null;
    if (error) toast.error('Αποτυχία αποθήκευσης: ' + error.message);
    else toast.success('Η προπόνηση αποθηκεύτηκε');
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

          <main className="flex-1 p-3 lg:p-4 overflow-auto space-y-2">
            <div className="hidden lg:flex items-center gap-2">
              <HeartPulse className="h-5 w-5" />
              <h1 className="text-xl font-bold">Heart Rate (HR+)</h1>
            </div>

            {!supported && (
              <Card className="rounded-none border-destructive">
                <CardContent className="p-4 text-sm">
                  Ο browser δεν υποστηρίζει Bluetooth. Χρησιμοποίησε Chrome ή Edge σε υπολογιστή ή Android. Στο iPhone (Safari) δεν λειτουργεί.
                </CardContent>
              </Card>
            )}

            <Card className="rounded-none">
              <CardContent className="p-2.5 flex flex-wrap items-center gap-2">
                {!connected ? (
                  <Button onClick={connect} disabled={!supported} size="sm" className="rounded-none text-xs">
                    <Bluetooth className="h-3.5 w-3.5 mr-1.5" /> Σύνδεση συσκευής
                  </Button>
                ) : (
                  <Button variant="outline" onClick={disconnect} size="sm" className="rounded-none text-xs">
                    <BluetoothOff className="h-3.5 w-3.5 mr-1.5" /> Αποσύνδεση
                  </Button>
                )}
                {!recording ? (
                  <Button onClick={startRecording} disabled={!connected || saving} size="sm" className="rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black text-xs">
                    <Play className="h-3.5 w-3.5 mr-1.5" /> Έναρξη προπόνησης
                  </Button>
                ) : (
                  <Button onClick={stopRecording} variant="destructive" size="sm" className="rounded-none text-xs">
                    <Square className="h-3.5 w-3.5 mr-1.5" /> Λήξη προπόνησης
                  </Button>
                )}
                {recording && <span className="text-[10px] text-destructive animate-pulse">● Καταγραφή</span>}
                <Button variant="outline" onClick={reset} disabled={recording} size="sm" className="rounded-none text-xs">
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Μηδενισμός
                </Button>
                <span className="text-xs text-muted-foreground">
                  {connected ? `Συνδεδεμένο: ${deviceName}` : 'Καμία συσκευή'}
                </span>
              </CardContent>
            </Card>

            <Card className="rounded-none">
              <CardContent className="p-2.5 flex items-center gap-4">
                <div className="flex flex-col items-center shrink-0 w-[74px]">
                  <HeartPulse className={`h-4 w-4 ${connected ? 'animate-pulse text-destructive' : 'text-muted-foreground'}`} />
                  <div className="text-4xl font-bold leading-none mt-0.5">{bpm ?? '--'}</div>
                  <div className="text-[10px] text-muted-foreground">BPM</div>
                </div>
                <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-x-3 gap-y-1">
                  {[['Μέσος', avg], ['Max', max], ['Min', min], ['RMSSD (ms)', rmssd]].map(([l, v]) => (
                    <div key={l as string} className="flex items-baseline justify-between gap-1 border-b border-border/40 pb-0.5">
                      <span className="text-[10px] text-muted-foreground truncate">{l}</span>
                      <span className="text-sm font-semibold">{v ?? '--'}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-none">
              <CardHeader className="pb-1 pt-2 px-3 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-xs">Γράφημα παλμών & ζώνες</CardTitle>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <span>Max HR:</span>
                  <Input
                    type="number"
                    value={maxHrSetting}
                    onChange={(e) => { maxHrTouchedRef.current = true; setMaxHrSetting(e.target.value); }}
                    className="rounded-none h-6 w-16 text-xs"
                  />
                  {maxHrAuto !== null && (
                    <span className="text-[9px] hidden sm:inline">
                      {maxHrTouchedRef.current ? 'χειροκίνητο' : 'αυτόματο (220−ηλικία×0.33)'}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-28" preserveAspectRatio="none">
                  {zones.map(z => {
                    const yTop = Math.max(0, yFor(maxHr * z.to));
                    const yBottom = Math.min(H, yFor(maxHr * z.from));
                    const bandH = yBottom - yTop;
                    if (bandH <= 0) return null;
                    return (
                      <g key={z.name}>
                        <rect x={0} y={yTop} width={W} height={bandH} fill={z.color} opacity={0.18} />
                        <text x={W - 4} y={yTop + 10} textAnchor="end" fontSize={8} fontWeight="bold" fill={z.color}>
                          {z.name}
                        </text>
                      </g>
                    );
                  })}
                  {samples.length > 1 && (
                    <polyline points={points} fill="none" stroke="hsl(var(--foreground))" strokeWidth="2" />
                  )}
                </svg>
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 mt-1">
                  {zones.map(z => (
                    <span key={z.name} className="flex items-center gap-1 text-[9px] text-muted-foreground">
                      <span className="inline-block w-2 h-2" style={{ backgroundColor: z.color }} />
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
