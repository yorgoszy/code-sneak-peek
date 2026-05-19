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

export interface PhaseInfo {
  phase: CyclePhase;
  dayOfCycle: number; // 1-based
  cycleStart: Date;
  nextStart: Date;
  recommendation: string;
  intensity: "light" | "strong" | "moderate";
  label: string;
}

const toDate = (s: string | Date) => (typeof s === "string" ? parseISO(s) : s);

/**
 * Find the most recent cycle entry that started on or before the target date.
 * Cycles are expected sorted desc by start_date or any order — function sorts.
 */
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
  return null;
}

/**
 * Compute phase info for a target date given the user's cycle history.
 * Predictive: if target is past the recorded cycle's expected length,
 * we project forward using the same cycle_length & period_length.
 */
export function getPhaseForDate(
  cycles: CycleRecord[],
  target: Date
): PhaseInfo | null {
  const base = findActiveCycle(cycles, target);
  if (!base) return null;

  const cycleLen = base.cycle_length || 28;
  const periodLen = base.period_length || 5;

  const startDate = toDate(base.start_date);
  const daysSinceStart = differenceInCalendarDays(target, startDate);
  // Wrap into a predicted cycle if past
  const dayOfCycle = ((daysSinceStart % cycleLen) + cycleLen) % cycleLen + 1;

  const cyclesElapsed = Math.floor(daysSinceStart / cycleLen);
  const cycleStart = addDays(startDate, cyclesElapsed * cycleLen);
  const nextStart = addDays(cycleStart, cycleLen);

  // Phase boundaries (general guidelines):
  // Menstrual:  day 1..periodLen
  // Follicular: periodLen+1..ovulation-1
  // Ovulation:  ~ cycleLen - 14 (one day)
  // Luteal:     ovulation+1..cycleLen
  const ovulationDay = Math.max(periodLen + 2, cycleLen - 14);

  let phase: CyclePhase;
  if (dayOfCycle <= periodLen) phase = "menstrual";
  else if (dayOfCycle < ovulationDay) phase = "follicular";
  else if (dayOfCycle === ovulationDay) phase = "ovulation";
  else phase = "luteal";

  const map: Record<CyclePhase, { label: string; intensity: PhaseInfo["intensity"]; rec: string }> = {
    menstrual: {
      label: "Περίοδος",
      intensity: "light",
      rec: "Εβδομάδα για χαλαρή προπόνηση. Ελαφριά ένταση, mobility & χαμηλός όγκος.",
    },
    follicular: {
      label: "Ωοθυλακιορρηξία (Follicular)",
      intensity: "strong",
      rec: "Εβδομάδα για δυνατή προπόνηση. Ιδανικά για δύναμη & PRs.",
    },
    ovulation: {
      label: "Ωορρηξία",
      intensity: "strong",
      rec: "Κορυφαία απόδοση — δοκίμασε εκρηκτικές & μέγιστες προσπάθειες.",
    },
    luteal: {
      label: "Ωχρινική (Luteal)",
      intensity: "moderate",
      rec: "Μέτρια ένταση. Σταδιακή μείωση όγκου καθώς πλησιάζει η επόμενη περίοδος.",
    },
  };

  const m = map[phase];
  return {
    phase,
    dayOfCycle,
    cycleStart,
    nextStart,
    recommendation: m.rec,
    intensity: m.intensity,
    label: m.label,
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
