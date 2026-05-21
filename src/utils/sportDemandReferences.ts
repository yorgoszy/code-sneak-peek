/**
 * Sport demand reference values from peer-reviewed literature.
 * Used as benchmarks in the Game Demand Analyzer.
 */

export interface SportDemandReference {
  sport: string;
  position?: string;
  relativeDistance_m_per_min: { min: number; max: number };
  rsbsPerMatch?: { min: number; max: number };
  source: string;
}

export const SPORT_DEMAND_REFERENCES: SportDemandReference[] = [
  {
    sport: 'football',
    relativeDistance_m_per_min: { min: 100, max: 110 },
    source: 'Gabbett & Mulvey 2008',
  },
  {
    sport: 'football',
    position: 'midfielder',
    relativeDistance_m_per_min: { min: 100, max: 115 },
    rsbsPerMatch: { min: 6, max: 6 },
    source: 'Gabbett & Mulvey 2008',
  },
];

export const FOOTBALL_RELATIVE_DISTANCE_M_PER_MIN = { min: 100, max: 110 };
export const FOOTBALL_MIDFIELDER_RSBS_PER_MATCH = 6;

export function getSportReference(
  sport?: string | null,
  position?: string | null
): SportDemandReference | undefined {
  if (!sport) return undefined;
  const s = sport.toLowerCase().trim();
  const p = position?.toLowerCase().trim();
  return (
    SPORT_DEMAND_REFERENCES.find(
      (r) => r.sport === s && r.position && p && r.position === p
    ) || SPORT_DEMAND_REFERENCES.find((r) => r.sport === s && !r.position)
  );
}
