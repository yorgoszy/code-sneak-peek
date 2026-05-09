// Plan Strong / Build Strong calculator - port of plan_ecc.xlsx WORKSHEET #1 logic.
// Each "side" (left/right of excel) is one independent plan computed by computeSide().

export interface PlanStrongSideInput {
  lift: string;            // BP, SQ, DL...
  prepComp: string;        // PREP / COMP
  oneRM: number;           // D5
  unit: 'KG' | 'LB';       // E5
  ps: number;              // F5 (PS 50/70)
  monthlyNL: number;       // G5
  // Row 10: % of monthly NL per intensity zone (B10..M10)
  zonePct: number[];       // length 12 -> [50-60, 61-70, 71-80, 81-90, 91-94, >=95, 105, 110, 115, 120, 130, 140]
  // Row 14: main variant weekly % distribution (C14..F14) - 4 weeks
  mainPct: number[];       // length 4
  // Row 17: variant 91-100 weekly %
  v91Pct: number[];        // length 4
  // Row 24: variant 81-90 weekly %
  v81Pct: number[];        // length 4
}

export const ZONE_LABELS = [
  '50-60%1RM','61-70%1RM','71-80%1RM','81-90%1RM','91-94%1RM','>=95%1RM',
  '105%','110%','115%','120%','130%','140%'
];

// Intensity coefficients for HARI (row 8 / 10 in excel)
export const ZONE_COEF = [0, 0, 0.75, 0.85, 0.93, 1, 1.05, 1.10, 1.15, 1.20, 1.30, 1.40];

export interface PlanStrongSideOutput {
  zoneKg: number[];        // weight per zone (1RM * coef)
  ari: number;             // average relative intensity for the month
  monthlyNlPerZone: number[]; // monthly NL split per zone (B12..M12)
  mainNlPerWeek: number[]; // C15..F15 (= monthlyNL * mainPct)
  v91NlPerWeek: number[];  // ≥95 + <95 splits aggregated
  weeklyHari: number[];    // C33..F33
  totalNL: number;
}

export function computeSide(s: PlanStrongSideInput): PlanStrongSideOutput {
  const zoneKg = ZONE_COEF.map(c => +(s.oneRM * c).toFixed(2));
  // ARI = sum(coef * pct)
  const ari = ZONE_COEF.reduce((a, c, i) => a + c * (s.zonePct[i] || 0), 0);
  const monthlyNlPerZone = s.zonePct.map(p => +(s.monthlyNL * p).toFixed(2));
  const mainNlPerWeek = s.mainPct.map(p => +(s.monthlyNL * p).toFixed(2));
  const v91NlPerWeek = s.v91Pct.map(p => +(s.monthlyNL * p).toFixed(2));
  // Weekly HARI - simplified: use main variant pct distribution across zones approx
  // Faithful to excel: needs per-week NL per zone. We model proportionally.
  const weeklyHari = s.mainPct.map((wpct) => {
    const weekNl = s.monthlyNL * wpct;
    if (!weekNl) return 0;
    // Approximate weekly distribution: same shape as monthly zonePct
    const intensity = ZONE_COEF.reduce(
      (a, c, i) => a + c * (s.zonePct[i] * weekNl) / weekNl,
      0
    );
    return +(intensity * 100).toFixed(2);
  });
  return {
    zoneKg,
    ari: +ari.toFixed(4),
    monthlyNlPerZone,
    mainNlPerWeek,
    v91NlPerWeek,
    weeklyHari,
    totalNL: s.monthlyNL,
  };
}

export function defaultSide(): PlanStrongSideInput {
  return {
    lift: 'BP',
    prepComp: 'PREP',
    oneRM: 120,
    unit: 'KG',
    ps: 70,
    monthlyNL: 200,
    zonePct: [0, 0, 0.58, 0.35, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0],
    mainPct: [0.22, 0.15, 0.35, 0.28],
    v91Pct: [0.28, 0.35, 0.15, 0.22],
    v81Pct: [0.22, 0.15, 0.28, 0.35],
  };
}

export interface SessionWeek {
  week: 1 | 2 | 3 | 4;
  // sessionNL[zoneIndex 0..5][session 0..4]
  sessions: number[][];
  // free-text plan strings per session per zone (e.g. "3x75")
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
  left: PlanStrongSideInput;
  right: PlanStrongSideInput;
  sessionsLeft: SessionWeek[];   // 4 weeks
  sessionsRight: SessionWeek[];  // 4 weeks
  ws3Notes: string;
}

export function defaultPlanStrongData(): PlanStrongData {
  return {
    left: defaultSide(),
    right: { ...defaultSide(), lift: 'SQ', oneRM: 0, monthlyNL: 0,
             zonePct: Array(12).fill(0), mainPct: [0,0,0,0],
             v91Pct: [0,0,0,0], v81Pct: [0,0,0,0] },
    sessionsLeft: [defaultSessionWeek(1), defaultSessionWeek(2), defaultSessionWeek(3), defaultSessionWeek(4)],
    sessionsRight: [defaultSessionWeek(1), defaultSessionWeek(2), defaultSessionWeek(3), defaultSessionWeek(4)],
    ws3Notes: '',
  };
}
