/**
 * Bar Velocity Tracker
 * HSV-based color marker tracking με αυτόματη ανίχνευση επαναλήψεων.
 *
 * Μετρά ανά rep:
 *  - mean / peak concentric velocity (m/s)
 *  - mean / peak eccentric velocity (m/s)
 *  - mean / peak power (W)  [P = F * v, F = load_kg * 9.81]
 *  - range of motion (cm)
 *  - bar movement duration (ms)  — όσο η μπάρα κινούνταν
 *  - rep total duration (ms)     — από έναρξη μέχρι λήξη επανάληψης
 *  - concentric / eccentric duration (ms)
 *  - rep_started_at / rep_ended_at
 */

export interface Sample {
  t: number;       // ms (performance.now)
  x: number;       // px
  y: number;       // px
  vy: number;      // px/s (vertical)
}

export interface RepMetrics {
  rep_number: number;
  set_number: number;
  load_kg: number;
  mean_velocity_ms: number;
  peak_velocity_ms: number;
  mean_eccentric_velocity_ms: number;
  peak_eccentric_velocity_ms: number;
  mean_power_w: number;
  peak_power_w: number;
  range_of_motion_cm: number;
  bar_movement_duration_ms: number;
  rep_total_duration_ms: number;
  concentric_duration_ms: number;
  eccentric_duration_ms: number;
  rep_started_at: string;
  rep_ended_at: string;
  raw_samples: Sample[];
}

export interface TrackerCalibration {
  pixels_per_meter: number;
  hsv_lower: [number, number, number];
  hsv_upper: [number, number, number];
}

export interface TrackerOptions {
  fps?: number;
  /** kg φορτίο για υπολογισμό power */
  loadKg: number;
  /** set στο οποίο ανήκουν τα reps */
  setNumber: number;
  calibration: TrackerCalibration;
  /** ελάχιστη ταχύτητα (m/s) για να θεωρηθεί ότι η μπάρα κινείται */
  movementThresholdMs?: number;
  /** ελάχιστη μετατόπιση (m) ώστε να μετρηθεί ως πλήρης rep */
  minRomMeters?: number;
}

const G = 9.81;

export class BarVelocityTracker {
  private video: HTMLVideoElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private rafId: number | null = null;
  private running = false;

  private samples: Sample[] = [];
  private opts: Required<Omit<TrackerOptions, 'calibration'>> & { calibration: TrackerCalibration };

  // rep state machine: idle -> eccentric -> bottom -> concentric -> top (=> rep complete)
  private phase: 'idle' | 'eccentric' | 'concentric' = 'idle';
  private repStartIdx = 0;
  private bottomIdx = 0;
  private repCount = 0;
  private onRepCb: ((r: RepMetrics) => void) | null = null;
  private onSampleCb: ((s: Sample) => void) | null = null;

  constructor(video: HTMLVideoElement, options: TrackerOptions) {
    this.video = video;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!;
    this.opts = {
      fps: options.fps ?? 30,
      loadKg: options.loadKg,
      setNumber: options.setNumber,
      calibration: options.calibration,
      movementThresholdMs: options.movementThresholdMs ?? 0.05,
      minRomMeters: options.minRomMeters ?? 0.10,
    };
  }

  start(onRep: (r: RepMetrics) => void, onSample?: (s: Sample) => void) {
    this.onRepCb = onRep;
    this.onSampleCb = onSample ?? null;
    this.running = true;
    this.canvas.width = this.video.videoWidth || 640;
    this.canvas.height = this.video.videoHeight || 480;
    this.loop();
  }

  stop() {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;
  }

  reset() {
    this.samples = [];
    this.phase = 'idle';
    this.repCount = 0;
  }

  private loop = () => {
    if (!this.running) return;
    this.processFrame();
    this.rafId = requestAnimationFrame(this.loop);
  };

  /** Detect colored marker via HSV mask & centroid */
  private detectMarker(): { x: number; y: number } | null {
    const w = this.canvas.width;
    const h = this.canvas.height;
    if (!w || !h) return null;
    this.ctx.drawImage(this.video, 0, 0, w, h);
    const img = this.ctx.getImageData(0, 0, w, h);
    const data = img.data;
    const [hL, sL, vL] = this.opts.calibration.hsv_lower;
    const [hU, sU, vU] = this.opts.calibration.hsv_upper;

    let sumX = 0, sumY = 0, count = 0;
    // Subsample every 4 pixels in each axis for performance
    for (let y = 0; y < h; y += 4) {
      for (let x = 0; x < w; x += 4) {
        const i = (y * w + x) * 4;
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const [hh, ss, vv] = rgbToHsv(r, g, b);
        if (hh >= hL && hh <= hU && ss >= sL && ss <= sU && vv >= vL && vv <= vU) {
          sumX += x;
          sumY += y;
          count++;
        }
      }
    }
    if (count < 20) return null;
    return { x: sumX / count, y: sumY / count };
  }

  private processFrame() {
    const m = this.detectMarker();
    const t = performance.now();
    if (!m) return;

    const prev = this.samples[this.samples.length - 1];
    let vy = 0;
    if (prev) {
      const dt = (t - prev.t) / 1000;
      if (dt > 0) vy = (m.y - prev.y) / dt; // px/s — y αυξάνεται προς τα κάτω
    }
    const sample: Sample = { t, x: m.x, y: m.y, vy };
    this.samples.push(sample);
    this.onSampleCb?.(sample);

    this.detectRepTransition();
  }

  /** Rep detection με βάση την κάθετη ταχύτητα */
  private detectRepTransition() {
    const n = this.samples.length;
    if (n < 5) return;
    const cur = this.samples[n - 1];
    // Smooth vy με μέσο όρο των 3 τελευταίων samples
    const vyAvg = (this.samples[n - 1].vy + this.samples[n - 2].vy + this.samples[n - 3].vy) / 3;
    const ppm = this.opts.calibration.pixels_per_meter;
    const vyMs = vyAvg / ppm; // m/s (positive = down = eccentric για squat-like)
    const thr = this.opts.movementThresholdMs;

    if (this.phase === 'idle') {
      if (vyMs > thr) {
        this.phase = 'eccentric';
        this.repStartIdx = n - 1;
      } else if (vyMs < -thr) {
        // Ξεκινά με concentric (π.χ. deadlift) — θεωρούμε bottom = start
        this.phase = 'concentric';
        this.repStartIdx = n - 1;
        this.bottomIdx = n - 1;
      }
    } else if (this.phase === 'eccentric') {
      if (vyMs < -thr) {
        // αλλαγή φοράς -> bottom
        this.bottomIdx = n - 1;
        this.phase = 'concentric';
      }
    } else if (this.phase === 'concentric') {
      // rep ολοκληρώνεται όταν η ταχύτητα μηδενίζεται μετά από concentric
      if (Math.abs(vyMs) < thr * 0.8) {
        this.finalizeRep(this.repStartIdx, this.bottomIdx, n - 1);
        this.phase = 'idle';
      }
    }
  }

  private finalizeRep(startIdx: number, bottomIdx: number, endIdx: number) {
    const slice = this.samples.slice(startIdx, endIdx + 1);
    if (slice.length < 3) return;
    const ppm = this.opts.calibration.pixels_per_meter;

    // Range of motion = max - min Y
    const ys = slice.map(s => s.y);
    const romPx = Math.max(...ys) - Math.min(...ys);
    const romM = romPx / ppm;
    if (romM < this.opts.minRomMeters) {
      // false positive — αγνόησε
      return;
    }

    const ecc = this.samples.slice(startIdx, bottomIdx + 1);
    const con = this.samples.slice(bottomIdx, endIdx + 1);

    const eccVel = ecc.map(s => Math.abs(s.vy) / ppm).filter(v => v > 0);
    const conVel = con.map(s => Math.abs(s.vy) / ppm).filter(v => v > 0);

    const meanV = avg(conVel);
    const peakV = Math.max(0, ...conVel);
    const meanEcc = avg(eccVel);
    const peakEcc = Math.max(0, ...eccVel);

    const force = this.opts.loadKg * G;
    const conPower = conVel.map(v => v * force);
    const meanP = avg(conPower);
    const peakP = Math.max(0, ...conPower);

    const repTotalMs = Math.round(slice[slice.length - 1].t - slice[0].t);
    const conMs = Math.round(con[con.length - 1].t - con[0].t);
    const eccMs = Math.round(ecc[ecc.length - 1].t - ecc[0].t);

    // bar movement duration: όσα ms είχαμε vy > threshold
    const movingMs = slice.reduce((acc, s, i) => {
      if (i === 0) return 0;
      const dt = s.t - slice[i - 1].t;
      const speedMs = Math.abs(s.vy) / ppm;
      return acc + (speedMs > this.opts.movementThresholdMs ? dt : 0);
    }, 0);

    this.repCount += 1;
    const now = new Date();
    const rep: RepMetrics = {
      rep_number: this.repCount,
      set_number: this.opts.setNumber,
      load_kg: this.opts.loadKg,
      mean_velocity_ms: round(meanV, 3),
      peak_velocity_ms: round(peakV, 3),
      mean_eccentric_velocity_ms: round(meanEcc, 3),
      peak_eccentric_velocity_ms: round(peakEcc, 3),
      mean_power_w: round(meanP, 2),
      peak_power_w: round(peakP, 2),
      range_of_motion_cm: round(romM * 100, 2),
      bar_movement_duration_ms: Math.round(movingMs),
      rep_total_duration_ms: repTotalMs,
      concentric_duration_ms: conMs,
      eccentric_duration_ms: eccMs,
      rep_started_at: new Date(now.getTime() - repTotalMs).toISOString(),
      rep_ended_at: now.toISOString(),
      raw_samples: slice,
    };
    this.onRepCb?.(rep);
  }

  /** allow external set switch (νέο set) */
  setSetNumber(n: number) {
    this.opts.setNumber = n;
    this.repCount = 0;
    this.phase = 'idle';
  }

  setLoadKg(kg: number) {
    this.opts.loadKg = kg;
  }
}

function avg(arr: number[]): number {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
function round(v: number, d: number): number {
  const f = Math.pow(10, d);
  return Math.round(v * f) / f;
}

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  // Match OpenCV HSV scale: H in 0-179, S/V in 0-255
  const H = Math.round(h / 2);
  const S = max === 0 ? 0 : Math.round((d / max) * 255);
  const V = Math.round(max * 255);
  return [H, S, V];
}
