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
  const weeklyHari = s.mainPct.map((wpct) => {
    const weekNl = monthlyNL * wpct;
    if (!weekNl) return 0;
    const intensity = coef.reduce(
      (a, c, i) => a + c * (zonePct[i] * weekNl) / weekNl,
      0
    );
    return +(intensity * 100).toFixed(2);
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
  sessions: number[][];
  plans: string[][];
}

export function defaultSessionWeek(week: 1 | 2 | 3 | 4): SessionWeek {
  return {
    week,
    sessions: Array.from({ length: 6 }, () => [0, 0, 0, 0, 0]),
    plans: Array.from({ length: 6 }, () => ['', '', '', '', '']),
  };
}

export interface PlanStrongData {
  side: PlanStrongSideInput;          // single sheet now (PS dropdown)
  sessions: SessionWeek[];
  ws3Notes: string;
  // legacy fields kept for backward compat with saved drafts
  left?: PlanStrongSideInput;
  right?: PlanStrongSideInput;
  sessionsLeft?: SessionWeek[];
  sessionsRight?: SessionWeek[];
}

export function defaultPlanStrongData(): PlanStrongData {
  return {
    side: defaultSide(),
    sessions: [defaultSessionWeek(1), defaultSessionWeek(2), defaultSessionWeek(3), defaultSessionWeek(4)],
    ws3Notes: '',
  };
}
