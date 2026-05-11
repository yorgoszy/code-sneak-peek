// Plan Strong / Build Strong calculator - port of plan_ecc.xlsx WORKSHEET #1 logic.

export interface PlanStrongSideInput {
  lift: string;
  prepComp: string;        // PREP / COMP
  oneRM: number | '';
  unit: 'KG' | 'LB';
  ps: '50' | '70' | 'BTS3' | 'BTS6';   // dropdown
  monthlyNL: number | '';
  zonePct: number[];       // length 12 (fractions, e.g. 0.58)
  mainPct: number[];       // length 4
  v91Pct: number[];        // length 4
  v81Pct: number[];        // length 4
}

export const ZONE_LABELS = [
  '50-60%1RM','61-70%1RM','71-80%1RM','81-90%1RM','91-94%1RM','>=95%1RM',
  '105%','110%','115%','120%','130%','140%'
];

// Display strings for the %1RM row (no decimals)
export const ZONE_PCT_LABELS = ['55%','65%','75%','85%','93%','100%','105%','110%','115%','120%','130%','140%'];

// Intensity coefficients for HARI calc
export const ZONE_COEF = [0.55, 0.65, 0.75, 0.85, 0.93, 1, 1.05, 1.10, 1.15, 1.20, 1.30, 1.40];

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
  const zoneKg = ZONE_COEF.map(c => +(oneRM * c).toFixed(2));
  const ari = ZONE_COEF.reduce((a, c, i) => a + c * (s.zonePct[i] || 0), 0);
  const monthlyNlPerZone = s.zonePct.map(p => +(monthlyNL * p).toFixed(2));
  const mainNlPerWeek = s.mainPct.map(p => +(monthlyNL * p).toFixed(2));
  const v91NlPerWeek = s.v91Pct.map(p => +(monthlyNL * p).toFixed(2));
  const weeklyHari = s.mainPct.map((wpct) => {
    const weekNl = monthlyNL * wpct;
    if (!weekNl) return 0;
    const intensity = ZONE_COEF.reduce(
      (a, c, i) => a + c * (s.zonePct[i] * weekNl) / weekNl,
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
    prepComp: 'PREP',
    oneRM: '',
    unit: 'KG',
    ps: 50,
    monthlyNL: '',
    zonePct: Array(12).fill(0),
    mainPct: [0, 0, 0, 0],
    v91Pct: [0, 0, 0, 0],
    v81Pct: [0, 0, 0, 0],
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
