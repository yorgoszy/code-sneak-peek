// Plan Strong / Build Strong calculator - port of plan_ecc.xlsx WORKSHEET #1 logic.

export interface PlanStrongSideInput {
  lift: string;
  exerciseId?: string;
  prepComp: string;        // PREP / COMP
  oneRM: number | '';
  unit: 'KG' | 'LB';
  ps: '50' | '70' | 'BTS3' | 'BTS6';   // dropdown
  monthlyNL: number | '';
  zonePct: number[];       // length 6 (fractions, e.g. 0.58)
  zoneCoef?: number[];     // length 6 — editable %1RM row (fractions). Falls back to ZONE_COEF.
  mainPct: number[];       // length 4
  v91Pct: number[];        // length 4 — zone 4 (93% / 91-94%)
  v95Pct?: number[];       // length 4 — zone 5 (100% / >=95%)
  v81Pct: number[];        // length 4
  v71Pct?: number[];       // length 4 — VARIANT (71-80%)
  v61Pct?: number[];       // length 4 — VARIANT (61-70%)
  v50Pct?: number[];       // length 4 — VARIANT (50-60%)
}

export const ZONE_LABELS = [
  '50-60%1RM','61-70%1RM','71-80%1RM','81-90%1RM','91-94%1RM','>=95%1RM',
];

// Display strings for the %1RM row (no decimals)
export const ZONE_PCT_LABELS = ['55%','65%','75%','85%','93%','100%'];

// Intensity coefficients for HARI calc
export const ZONE_COEF = [0.55, 0.65, 0.75, 0.85, 0.93, 1];

// Week difficulty derived from MAIN VARIANT %1RM (15±3 → Light, 22±3 → Medium,
// 28±3 → Heavy, 35±3 → Very Heavy). Persisted with the draft and reusable in
// athlete profile, AI chat, etc.
export type WeekDifficulty = 'Light' | 'Medium' | 'Heavy' | 'Very Heavy' | null;
export const getWeekDifficulty = (frac: number): WeekDifficulty => {
  const pct = Math.round((frac || 0) * 100);
  if (Math.abs(pct - 15) <= 3) return 'Light';
  if (Math.abs(pct - 22) <= 3) return 'Medium';
  if (Math.abs(pct - 28) <= 3) return 'Heavy';
  if (Math.abs(pct - 35) <= 3) return 'Very Heavy';
  return null;
};
export const computeWeekDifficulties = (mainPct: number[]): WeekDifficulty[] =>
  (mainPct || []).map(getWeekDifficulty);

export const ZONE_COUNT = 6;

export interface PlanStrongSideOutput {
  zoneKg: number[];
  ari: number;
  monthlyNlPerZone: number[];
  mainNlPerWeek: number[];
  v91NlPerWeek: number[];
  weeklyHari: number[];
  totalNL: number;
}

export function computeSide(s: PlanStrongSideInput): PlanStrongSideOutput {
  const oneRM = Number(s.oneRM) || 0;
  const monthlyNL = Number(s.monthlyNL) || 0;
  const coef = (s.zoneCoef && s.zoneCoef.length === ZONE_COUNT) ? s.zoneCoef : ZONE_COEF;
  const zonePct = (s.zonePct && s.zonePct.length >= ZONE_COUNT) ? s.zonePct.slice(0, ZONE_COUNT) : Array(ZONE_COUNT).fill(0);
  const zoneKg = coef.map(c => +(oneRM * c).toFixed(2));
  const ari = coef.reduce((a, c, i) => a + c * (zonePct[i] || 0), 0);
  const roundNl = (n: number) => Math.round(n);
  const monthlyNlPerZone = zonePct.map(p => roundNl(monthlyNL * p));
  const mainNlPerWeek = s.mainPct.map(p => roundNl(monthlyNL * p));
  const v91NlPerWeek = s.v91Pct.map(p => roundNl(monthlyNL * p));
  // Weekly HARI per spreadsheet formula:
  //   weeklyHARI_w = Σ_z (variantNL_z_w / mainVariantNL_w) × zoneCoef[z] × 100
  // where variantNL_z_w = monthlyNL × zonePct[z] × vPct_z[w]
  //   and mainVariantNL_w = monthlyNL × mainPct[w]
  // => weeklyHARI_w = Σ_z (zonePct[z] × vPct_z[w] / mainPct[w]) × coef[z] × 100
  const variantByZone: (number[] | undefined)[] = [
    s.v50Pct, s.v61Pct, s.v71Pct, s.v81Pct, s.v91Pct, s.v95Pct,
  ];
  const weeklyHari = s.mainPct.map((mp, w) => {
    if (!mp) return 0;
    let sum = 0;
    for (let z = 0; z < ZONE_COUNT; z++) {
      const vArr = variantByZone[z];
      const vp = vArr && vArr.length === 4 ? (vArr[w] || 0) : 0;
      sum += (zonePct[z] || 0) * vp / mp * (coef[z] || 0);
    }
    return +(sum * 100).toFixed(2);
  });
  return {
    zoneKg, ari: +ari.toFixed(4), monthlyNlPerZone,
    mainNlPerWeek, v91NlPerWeek, weeklyHari, totalNL: monthlyNL,
  };
}

export function defaultSide(): PlanStrongSideInput {
  return {
    lift: '',
    exerciseId: undefined,
    prepComp: 'PREP',
    oneRM: '',
    unit: 'KG',
    ps: '50',
    monthlyNL: '',
    zonePct: Array(ZONE_COUNT).fill(0),
    zoneCoef: [...ZONE_COEF],
    mainPct: [0, 0, 0, 0],
    v91Pct: [0, 0, 0, 0],
    v95Pct: [0, 0, 0, 0],
    v81Pct: [0, 0, 0, 0],
    v71Pct: [0, 0, 0, 0],
    v61Pct: [0, 0, 0, 0],
    v50Pct: [0, 0, 0, 0],
  };
}

export interface SessionWeek {
  week: 1 | 2 | 3 | 4;
  sessions: number[][];   // [zone][day]
  plans: string[][];      // [zone][day]
}

export function defaultSessionWeek(week: 1 | 2 | 3 | 4, days: number = 5): SessionWeek {
  return {
    week,
    sessions: Array.from({ length: 6 }, () => Array(days).fill(0)),
    plans: Array.from({ length: 6 }, () => Array(days).fill('')),
  };
}

export interface PlanStrongMonthWS2 {
  weeks: SessionWeek[]; // always 4
}

export function defaultMonthWS2(): PlanStrongMonthWS2 {
  return {
    weeks: [defaultSessionWeek(1), defaultSessionWeek(2), defaultSessionWeek(3), defaultSessionWeek(4)],
  };
}

export interface PlanStrongData {
  side: PlanStrongSideInput;          // active (back-compat) — mirrors sides[activeSideIndex]
  sides?: PlanStrongSideInput[];      // one entry per exercise (tabs)
  activeSideIndex?: number;
  sessions: SessionWeek[];            // legacy (Month 1) — kept for backward compat
  ws2Months?: PlanStrongMonthWS2[];   // new: per-month WS2 (4 weeks each)
  ws3Notes: string;
  // legacy fields kept for backward compat with saved drafts
  left?: PlanStrongSideInput;
  right?: PlanStrongSideInput;
  sessionsLeft?: SessionWeek[];
  sessionsRight?: SessionWeek[];
}

export function defaultPlanStrongData(): PlanStrongData {
  const s = defaultSide();
  return {
    side: s,
    sides: [s],
    activeSideIndex: 0,
    sessions: [defaultSessionWeek(1), defaultSessionWeek(2), defaultSessionWeek(3), defaultSessionWeek(4)],
    ws2Months: [defaultMonthWS2()],
    ws3Notes: '',
  };
}

