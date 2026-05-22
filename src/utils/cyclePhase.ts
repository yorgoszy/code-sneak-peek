// Menstrual cycle phase calculation utilities
import { differenceInCalendarDays, addDays, parseISO } from "date-fns";

export type CycleRecord = {
  id: string;
  user_id: string;
  start_date: string; // YYYY-MM-DD
  period_length: number;
  cycle_length: number;
  notes?: string | null;
};

export type CyclePhase = "menstrual" | "follicular" | "ovulation" | "luteal";
export type TrainingIntensity = "light" | "moderate" | "strong" | "peak";

export interface PhaseInfo {
  phase: CyclePhase;
  dayOfCycle: number; // 1-based
  cycleStart: Date;
  nextStart: Date;
  periodEnd: Date;
  ovulationDate: Date;
  fertileStart: Date;
  fertileEnd: Date;
  isFertile: boolean;
  isOvulation: boolean;
  isPeriod: boolean;
  daysUntilNextPeriod: number;
  daysUntilOvulation: number;
  cycleLength: number;
  periodLength: number;
  recommendation: string;
  trainingAdvice: string;
  intensity: TrainingIntensity;
  label: string;
  emoji: string;
}

const toDate = (s: string | Date) => (typeof s === "string" ? parseISO(s) : s);

/**
 * Compute smart averages from cycle history. Falls back to the cycle's own values.
 */
export function getCycleAverages(cycles: CycleRecord[]) {
  if (!cycles?.length) return { avgCycle: 28, avgPeriod: 5 };
  const sorted = [...cycles].sort(
    (a, b) => toDate(a.start_date).getTime() - toDate(b.start_date).getTime()
  );
  // Use observed gaps between consecutive starts when possible
  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const g = differenceInCalendarDays(
      toDate(sorted[i].start_date),
      toDate(sorted[i - 1].start_date)
    );
    if (g >= 15 && g <= 60) gaps.push(g);
  }
  const avgCycle =
    gaps.length > 0
      ? Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length)
      : Math.round(
          sorted.reduce((s, c) => s + (c.cycle_length || 28), 0) / sorted.length
        );
  const avgPeriod = Math.round(
    sorted.reduce((s, c) => s + (c.period_length || 5), 0) / sorted.length
  );
  return { avgCycle, avgPeriod };
}

export function findActiveCycle(
  cycles: CycleRecord[],
  target: Date
): CycleRecord | null {
  if (!cycles?.length) return null;
  const sorted = [...cycles].sort(
    (a, b) => toDate(b.start_date).getTime() - toDate(a.start_date).getTime()
  );
  for (const c of sorted) {
    if (toDate(c.start_date).getTime() <= target.getTime()) return c;
  }
  // Future dates before any recorded cycle — use first
  return sorted[sorted.length - 1];
}

export function getPhaseForDate(
  cycles: CycleRecord[],
  target: Date
): PhaseInfo | null {
  const base = findActiveCycle(cycles, target);
  if (!base) return null;

  const { avgCycle, avgPeriod } = getCycleAverages(cycles);
  const cycleLen = base.cycle_length || avgCycle || 28;
  const periodLen = base.period_length || avgPeriod || 5;

  const startDate = toDate(base.start_date);
  const daysSinceStart = differenceInCalendarDays(target, startDate);
  const dayOfCycle = ((daysSinceStart % cycleLen) + cycleLen) % cycleLen + 1;

  const cyclesElapsed = Math.floor(daysSinceStart / cycleLen);
  const cycleStart = addDays(startDate, cyclesElapsed * cycleLen);
  const nextStart = addDays(cycleStart, cycleLen);
  const periodEnd = addDays(cycleStart, periodLen - 1);

  // Ovulation ~14 days before next period
  const ovulationDay = Math.max(periodLen + 2, cycleLen - 14);
  const ovulationDate = addDays(cycleStart, ovulationDay - 1);
  // Fertile window: 5 days before ovulation + ovulation + 1 day after
  const fertileStart = addDays(ovulationDate, -5);
  const fertileEnd = addDays(ovulationDate, 1);

  let phase: CyclePhase;
  if (dayOfCycle <= periodLen) phase = "menstrual";
  else if (dayOfCycle < ovulationDay) phase = "follicular";
  else if (dayOfCycle === ovulationDay) phase = "ovulation";
  else phase = "luteal";

  const isFertile =
    target.getTime() >= fertileStart.getTime() &&
    target.getTime() <= fertileEnd.getTime();
  const isOvulation = differenceInCalendarDays(target, ovulationDate) === 0;
  const isPeriod = dayOfCycle <= periodLen;

  const daysUntilNextPeriod = differenceInCalendarDays(nextStart, target);
  const daysUntilOvulation = differenceInCalendarDays(ovulationDate, target);

  const map: Record<
    CyclePhase,
    {
      label: string;
      emoji: string;
      intensity: TrainingIntensity;
      rec: string;
      training: string;
    }
  > = {
    menstrual: {
      label: "Περίοδος",
      emoji: "🩸",
      intensity: "light",
      rec: "Ξεκούραση & αυτο-φροντίδα. Ενυδάτωση, σίδηρος και ύπνος.",
      training:
        "Ελαφριά προπόνηση: yoga, mobility, περπάτημα, χαμηλής έντασης cardio. Απόφυγε max efforts & βαριά squats/deadlifts.",
    },
    follicular: {
      label: "Follicular (Ωοθυλακική)",
      emoji: "🌱",
      intensity: "strong",
      rec: "Υψηλή ενέργεια & ανάκαμψη. Ιδανική φάση για πρόοδο.",
      training:
        "Βαριά προπόνηση δύναμης, PR attempts, HIIT, plyometrics. Το σώμα σου ανταποκρίνεται καλύτερα σε νέα ερεθίσματα.",
    },
    ovulation: {
      label: "Ωορρηξία",
      emoji: "⚡",
      intensity: "peak",
      rec: "Κορυφαία φυσική απόδοση — εκμεταλλεύσου την.",
      training:
        "Peak day: 1RM tests, sprint intervals, εκρηκτικές κινήσεις. Προσοχή σε γόνατα/ACL (αυξημένο relaxin).",
    },
    luteal: {
      label: "Luteal (Ωχρινική)",
      emoji: "🌙",
      intensity: "moderate",
      rec: "Σταδιακή μείωση έντασης. Αυξημένη όρεξη & κούραση είναι φυσιολογικά.",
      training:
        "Μέτρια ένταση: tempo work, ασκήσεις τεχνικής, hypertrophy με μέτρια φορτία. Μείωσε όγκο τις τελευταίες 3-4 μέρες.",
    },
  };

  const m = map[phase];
  return {
    phase,
    dayOfCycle,
    cycleStart,
    nextStart,
    periodEnd,
    ovulationDate,
    fertileStart,
    fertileEnd,
    isFertile,
    isOvulation,
    isPeriod,
    daysUntilNextPeriod,
    daysUntilOvulation,
    cycleLength: cycleLen,
    periodLength: periodLen,
    recommendation: m.rec,
    trainingAdvice: m.training,
    intensity: m.intensity,
    label: m.label,
    emoji: m.emoji,
  };
}

export const phaseColor: Record<CyclePhase, string> = {
  menstrual: "bg-red-500",
  follicular: "bg-emerald-500",
  ovulation: "bg-amber-500",
  luteal: "bg-purple-500",
};

export const phaseSoftColor: Record<CyclePhase, string> = {
  menstrual: "bg-red-100 text-red-900 border-red-300",
  follicular: "bg-emerald-100 text-emerald-900 border-emerald-300",
  ovulation: "bg-amber-100 text-amber-900 border-amber-300",
  luteal: "bg-purple-100 text-purple-900 border-purple-300",
};

export const phaseBgTint: Record<CyclePhase, string> = {
  menstrual: "bg-red-50",
  follicular: "bg-emerald-50",
  ovulation: "bg-amber-50",
  luteal: "bg-purple-50",
};

export const intensityLabel: Record<TrainingIntensity, string> = {
  light: "Ελαφριά",
  moderate: "Μέτρια",
  strong: "Δυνατή",
  peak: "Peak",
};

export const intensityBadge: Record<TrainingIntensity, string> = {
  light: "bg-red-100 text-red-900 border-red-300",
  moderate: "bg-purple-100 text-purple-900 border-purple-300",
  strong: "bg-emerald-100 text-emerald-900 border-emerald-300",
  peak: "bg-amber-100 text-amber-900 border-amber-300",
};
