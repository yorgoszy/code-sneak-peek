import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Upload, Ruler, Crosshair, Play, Square, RotateCcw } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceArea } from "recharts";
import { toast } from "sonner";

type Pt = { x: number; y: number };
type Sample = { t: number; x: number; y: number }; // t = real seconds, x/y = px (analysis canvas)
type Rep = {
  n: number; start: number; end: number;
  meanV: number; peakV: number; romCm: number; durMs: number; meanP: number; peakP: number;
};

const ANALYSIS_W = 640;

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60; if (h < 0) h += 360;
  }
  return [h, max ? d / max : 0, max];
}

const hueDist = (a: number, b: number) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };

export const BarVelocityFileAnalyzer = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const viewRef = useRef<HTMLCanvasElement>(null);
  const workRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  const stopRef = useRef(false);

  const [src, setSrc] = useState<string | null>(null);
  const [captureFps, setCaptureFps] = useState('160');
  const [fileFps, setFileFps] = useState('30');
  const [loadKg, setLoadKg] = useState('100');
  const [knownCm, setKnownCm] = useState('45');
  const [mode, setMode] = useState<'none' | 'calib' | 'marker'>('none');
  const [calib, setCalib] = useState<Pt[]>([]);
  const [marker, setMarker] = useState<{ pt: Pt; h: number; s: number; v: number } | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [reps, setReps] = useState<Rep[]>([]);

  useEffect(() => () => { if (src) URL.revokeObjectURL(src); }, [src]);

  const scale = () => {
    const v = videoRef.current!;
    return ANALYSIS_W / (v.videoWidth || ANALYSIS_W);
  };
  const workH = () => Math.round((videoRef.current!.videoHeight || 360) * scale());

  const draw = (trail: Sample[] = samples) => {
    const v = videoRef.current, c = viewRef.current;
    if (!v || !c || !v.videoWidth) return;
    c.width = ANALYSIS_W; c.height = workH();
    const ctx = c.getContext('2d')!;
    ctx.drawImage(v, 0, 0, c.width, c.height);
    if (calib.length) {
      ctx.strokeStyle = '#cb8954'; ctx.fillStyle = '#cb8954'; ctx.lineWidth = 2;
      calib.forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fill(); });
      if (calib.length === 2) { ctx.beginPath(); ctx.moveTo(calib[0].x, calib[0].y); ctx.lineTo(calib[1].x, calib[1].y); ctx.stroke(); }
    }
    if (trail.length > 1) {
      ctx.strokeStyle = '#00ffba'; ctx.lineWidth = 2; ctx.beginPath();
      trail.forEach((s, i) => (i ? ctx.lineTo(s.x, s.y) : ctx.moveTo(s.x, s.y)));
      ctx.stroke();
    }
    const last = trail[trail.length - 1] ?? (marker ? { ...marker.pt } : null);
    if (last) { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(last.x, last.y, 10, 0, Math.PI * 2); ctx.stroke(); }
  };

  const onFile = (f?: File) => {
    if (!f) return;
    if (src) URL.revokeObjectURL(src);
    setSrc(URL.createObjectURL(f));
    setCalib([]); setMarker(null); setSamples([]); setReps([]);
  };

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const c = viewRef.current!; const r = c.getBoundingClientRect();
    const p = { x: (e.clientX - r.left) * c.width / r.width, y: (e.clientY - r.top) * c.height / r.height };
    if (mode === 'calib') {
      const next = calib.length >= 2 ? [p] : [...calib, p];
      setCalib(next);
      if (next.length === 2) setMode('none');
    } else if (mode === 'marker') {
      const ctx = c.getContext('2d')!;
      ctx.drawImage(videoRef.current!, 0, 0, c.width, c.height);
      const d = ctx.getImageData(Math.max(0, p.x - 2), Math.max(0, p.y - 2), 5, 5).data;
      let r2 = 0, g2 = 0, b2 = 0; const n = d.length / 4;
      for (let i = 0; i < d.length; i += 4) { r2 += d[i]; g2 += d[i + 1]; b2 += d[i + 2]; }
      const [h, s, v] = rgbToHsv(r2 / n, g2 / n, b2 / n);
      if (s < 0.25) toast.warning('Το σημείο δεν έχει έντονο χρώμα — χρησιμοποίησε χρωματιστό αυτοκόλλητο στο άκρο της μπάρας.');
      setMarker({ pt: p, h, s, v });
      setMode('none');
    }
  };

  useEffect(() => { draw(); }, [calib, marker]); // eslint-disable-line react-hooks/exhaustive-deps

  const detect = (ctx: CanvasRenderingContext2D, w: number, h: number, around: Pt): Pt | null => {
    const R = 70;
    const x0 = Math.max(0, Math.floor(around.x - R)), y0 = Math.max(0, Math.floor(around.y - R));
    const x1 = Math.min(w, Math.ceil(around.x + R)), y1 = Math.min(h, Math.ceil(around.y + R));
    const img = ctx.getImageData(x0, y0, x1 - x0, y1 - y0);
    const d = img.data, iw = x1 - x0;
    const m = marker!;
    const sMin = Math.max(0.2, m.s * 0.5), vMin = Math.max(0.15, m.v * 0.45);
    let sx = 0, sy = 0, n = 0;
    for (let y = 0; y < y1 - y0; y += 1) for (let x = 0; x < iw; x += 1) {
      const i = (y * iw + x) * 4;
      const [hh, ss, vv] = rgbToHsv(d[i], d[i + 1], d[i + 2]);
      if (ss >= sMin && vv >= vMin && hueDist(hh, m.h) <= 14) { sx += x; sy += y; n++; }
    }
    if (n < 6) return null;
    return { x: x0 + sx / n, y: y0 + sy / n };
  };

  const ppm = () => {
    if (calib.length !== 2) return 0;
    const dpx = Math.hypot(calib[1].x - calib[0].x, calib[1].y - calib[0].y);
    return dpx / ((parseFloat(knownCm) || 45) / 100);
  };

  const analyze = async () => {
    const v = videoRef.current!;
    if (!marker) return toast.error('Κάνε κλικ πάνω στο χρωματιστό σημάδι της μπάρας.');
    if (calib.length !== 2) return toast.error('Κάνε βαθμονόμηση (2 σημεία σε γνωστή απόσταση, π.χ. διάμετρος δίσκου 45cm).');
    const cap = parseFloat(captureFps) || 30, ff = parseFloat(fileFps) || cap;
    const timeFactor = ff / cap; // real seconds per media second
    const w = ANALYSIS_W, h = workH();
    const work = workRef.current; work.width = w; work.height = h;
    const ctx = work.getContext('2d', { willReadFrequently: true })!;

    setAnalyzing(true); setProgress(0); setReps([]); stopRef.current = false;
    const out: Sample[] = [];
    let last: Pt = marker.pt;
    const startTime = v.currentTime;
    const dur = v.duration;

    const handle = (mediaTime: number) => {
      ctx.drawImage(v, 0, 0, w, h);
      const p = detect(ctx, w, h, last);
      if (p) {
        last = p;
        const t = (mediaTime - startTime) * timeFactor;
        if (!out.length || t > out[out.length - 1].t) out.push({ t, x: p.x, y: p.y });
      }
      setProgress(Math.min(100, ((mediaTime - startTime) / Math.max(0.01, dur - startTime)) * 100));
    };

    const hasRvfc = 'requestVideoFrameCallback' in HTMLVideoElement.prototype;
    if (hasRvfc) {
      v.muted = true;
      v.playbackRate = ff > 60 ? Math.max(0.1, 50 / ff) : 1;
      await new Promise<void>((resolve) => {
        const cb = (_: number, meta: { mediaTime: number }) => {
          handle(meta.mediaTime);
          if (stopRef.current || v.ended) { v.pause(); resolve(); return; }
          (v as any).requestVideoFrameCallback(cb);
        };
        (v as any).requestVideoFrameCallback(cb);
        v.onended = () => resolve();
        v.play().catch(() => resolve());
      });
      v.pause(); v.playbackRate = 1;
    } else {
      const step = 1 / ff;
      for (let tt = startTime; tt < dur && !stopRef.current; tt += step) {
        await new Promise<void>(r => { v.onseeked = () => r(); v.currentTime = tt; });
        handle(tt);
      }
    }

    setSamples(out);
    const found = computeReps(out, ppm(), parseFloat(loadKg) || 0);
    setReps(found);
    setAnalyzing(false); setProgress(100);
    draw(out);
    toast.success(found.length ? `Βρέθηκαν ${found.length} επαναλήψεις` : 'Δεν βρέθηκαν επαναλήψεις — έλεγξε σημάδι και βαθμονόμηση');
  };

  const chartData = velocitySeries(samples, ppm());
  const best = reps.length ? Math.max(...reps.map(r => r.meanV)) : 0;
  const last = reps[reps.length - 1];
  const velLoss = reps.length > 1 && best ? Math.round((1 - last.meanV / best) * 100) : null;

  return (
    <div className="space-y-4">
      <Card className="rounded-none">
        <CardContent className="p-3 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 items-end">
            <label className="col-span-2 md:col-span-1">
              <span className="text-xs text-muted-foreground">Βίντεο</span>
              <Button asChild variant="outline" size="sm" className="rounded-none w-full">
                <span className="cursor-pointer"><Upload className="h-4 w-4 mr-1" />Επιλογή αρχείου
                  <input type="file" accept="video/*" className="hidden" onChange={e => onFile(e.target.files?.[0])} />
                </span>
              </Button>
            </label>
            <label><span className="text-xs text-muted-foreground">fps λήψης</span>
              <Input value={captureFps} onChange={e => setCaptureFps(e.target.value)} className="h-8 rounded-none" /></label>
            <label><span className="text-xs text-muted-foreground">fps αρχείου</span>
              <Input value={fileFps} onChange={e => setFileFps(e.target.value)} className="h-8 rounded-none" /></label>
            <label><span className="text-xs text-muted-foreground">Φορτίο (kg)</span>
              <Input value={loadKg} onChange={e => setLoadKg(e.target.value)} className="h-8 rounded-none" /></label>
            <label><span className="text-xs text-muted-foreground">Απόσταση βαθμ. (cm)</span>
              <Input value={knownCm} onChange={e => setKnownCm(e.target.value)} className="h-8 rounded-none" /></label>
          </div>
          <p className="text-xs text-muted-foreground">
            Lumix G9 High Speed (VFR): γράφει στα 160–180 fps αλλά το αρχείο παίζει ως αργή κίνηση στα 30 fps — βάλε «fps λήψης» 160 και «fps αρχείου» 30. Αν το αρχείο παίζει σε κανονική ταχύτητα, βάλε τον ίδιο αριθμό και στα δύο.
          </p>
        </CardContent>
      </Card>

      {src && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="rounded-none lg:col-span-2">
            <CardContent className="p-2 space-y-2">
              <video ref={videoRef} src={src} className="hidden" muted playsInline preload="auto"
                onLoadedData={() => draw([])} onSeeked={() => !analyzing && draw([])} />
              <canvas ref={viewRef} onClick={onCanvasClick}
                className={`w-full bg-black ${mode !== 'none' ? 'cursor-crosshair' : ''}`} />
              <input type="range" min={0} max={1000} disabled={analyzing}
                className="w-full accent-[#00ffba]"
                onChange={e => { const v = videoRef.current!; v.currentTime = (Number(e.target.value) / 1000) * (v.duration || 0); }} />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant={mode === 'calib' ? 'default' : 'outline'} className="rounded-none" onClick={() => { setCalib([]); setMode('calib'); }} disabled={analyzing}>
                  <Ruler className="h-4 w-4 mr-1" />Βαθμονόμηση {calib.length === 2 ? '✓' : `${calib.length}/2`}
                </Button>
                <Button size="sm" variant={mode === 'marker' ? 'default' : 'outline'} className="rounded-none" onClick={() => setMode('marker')} disabled={analyzing}>
                  <Crosshair className="h-4 w-4 mr-1" />Σημάδι μπάρας {marker ? '✓' : ''}
                </Button>
                {!analyzing ? (
                  <Button size="sm" className="rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black" onClick={analyze}>
                    <Play className="h-4 w-4 mr-1" />Ανάλυση από εδώ
                  </Button>
                ) : (
                  <Button size="sm" variant="destructive" className="rounded-none" onClick={() => { stopRef.current = true; }}>
                    <Square className="h-4 w-4 mr-1" />Διακοπή
                  </Button>
                )}
                {samples.length > 0 && !analyzing && (
                  <Button size="sm" variant="outline" className="rounded-none" onClick={() => { setSamples([]); setReps([]); draw([]); }}>
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {mode === 'calib' && <p className="text-xs text-muted-foreground">Κάνε κλικ σε 2 σημεία με γνωστή απόσταση (π.χ. πάνω και κάτω άκρη δίσκου 45cm).</p>}
              {mode === 'marker' && <p className="text-xs text-muted-foreground">Κάνε κλικ πάνω στο χρωματιστό σημάδι στο άκρο της μπάρας.</p>}
              {analyzing && <Progress value={progress} className="h-2 rounded-none" />}
            </CardContent>
          </Card>

          <Card className="rounded-none">
            <CardContent className="p-3 space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <Stat label="Επαναλ." value={reps.length.toString()} />
                <Stat label="Καλύτερη MV" value={best ? best.toFixed(2) : '-'} unit="m/s" />
                <Stat label="Απώλεια" value={velLoss !== null ? `${velLoss}%` : '-'} />
              </div>
              <div className="space-y-1 max-h-[45vh] overflow-auto">
                {reps.map(r => (
                  <div key={r.n} className="border border-border p-2 text-xs grid grid-cols-4 gap-1">
                    <span className="font-semibold">#{r.n}</span>
                    <span>MV <b>{r.meanV.toFixed(2)}</b></span>
                    <span>PV <b>{r.peakV.toFixed(2)}</b></span>
                    <span>ROM {r.romCm.toFixed(0)}cm</span>
                    <span className="col-span-2 text-muted-foreground">{r.durMs} ms</span>
                    <span className="col-span-2 text-muted-foreground">{Math.round(r.meanP)} W μέση</span>
                  </div>
                ))}
                {!reps.length && <p className="text-xs text-muted-foreground">Οι επαναλήψεις θα εμφανιστούν μετά την ανάλυση. MV = μέση ταχύτητα ανόδου, PV = μέγιστη.</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {chartData.length > 2 && (
        <Card className="rounded-none">
          <CardContent className="p-2 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="t" type="number" domain={['dataMin', 'dataMax']} tickFormatter={v => `${v.toFixed(1)}s`} fontSize={10} />
                <YAxis fontSize={10} unit=" m/s" width={55} />
                <Tooltip formatter={(v: number) => `${v.toFixed(2)} m/s`} labelFormatter={(v: number) => `${v.toFixed(2)} s`} />
                {reps.map(r => <ReferenceArea key={r.n} x1={r.start} x2={r.end} fill="#00ffba" fillOpacity={0.15} />)}
                <Line dataKey="v" stroke="#00ffba" dot={false} strokeWidth={2} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const Stat = ({ label, value, unit }: { label: string; value: string; unit?: string }) => (
  <div className="border border-border p-2">
    <div className="text-[10px] text-muted-foreground">{label}</div>
    <div className="text-lg font-bold">{value}<span className="text-[10px] font-normal ml-0.5">{unit}</span></div>
  </div>
);

/** Smoothed vertical position (m, up = positive) and velocity per sample */
function kinematics(s: Sample[], ppm: number) {
  if (s.length < 5 || !ppm) return [] as { t: number; y: number; v: number }[];
  const k = 2;
  const y = s.map((_, i) => {
    let sum = 0, n = 0;
    for (let j = Math.max(0, i - k); j <= Math.min(s.length - 1, i + k); j++) { sum += -s[j].y / ppm; n++; }
    return sum / n;
  });
  return s.map((p, i) => {
    const a = Math.max(0, i - 1), b = Math.min(s.length - 1, i + 1);
    const dt = s[b].t - s[a].t;
    return { t: p.t, y: y[i], v: dt > 0 ? (y[b] - y[a]) / dt : 0 };
  });
}

function velocitySeries(s: Sample[], ppm: number) {
  return kinematics(s, ppm).map(k => ({ t: +k.t.toFixed(3), v: +Math.max(0, k.v).toFixed(3) }));
}

/** Concentric phases: upward velocity above threshold, ROM >= 10cm */
function computeReps(s: Sample[], ppm: number, loadKg: number): Rep[] {
  const k = kinematics(s, ppm);
  const reps: Rep[] = [];
  const thr = 0.08;
  let i = 0;
  while (i < k.length) {
    if (k[i].v > thr) {
      let j = i;
      while (j + 1 < k.length && k[j + 1].v > thr * 0.5) j++;
      const seg = k.slice(i, j + 1);
      const rom = seg[seg.length - 1].y - seg[0].y;
      const dur = seg[seg.length - 1].t - seg[0].t;
      if (rom >= 0.1 && dur > 0.05) {
        const vs = seg.map(x => x.v);
        const meanV = rom / dur;
        const peakV = Math.max(...vs);
        const F = loadKg * 9.81;
        reps.push({
          n: reps.length + 1, start: +seg[0].t.toFixed(3), end: +seg[seg.length - 1].t.toFixed(3),
          meanV, peakV, romCm: rom * 100, durMs: Math.round(dur * 1000),
          meanP: meanV * F, peakP: peakV * F,
        });
      }
      i = j + 1;
    } else i++;
  }
  return reps;
}
