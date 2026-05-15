import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type BandColor = "green" | "yellow" | "red" | "unknown";

export interface PerformanceBand {
  id: string;
  coach_id: string | null;
  metric_key: string;
  position_or_group: string | null;
  sport: string | null;
  age_group: string | null;
  green_min: number | null;
  green_max: number | null;
  yellow_min: number | null;
  yellow_max: number | null;
  red_min: number | null;
  red_max: number | null;
  notes: string | null;
  source: string | null;
}

interface Ctx {
  position?: string | null;
  sport?: string | null;
  ageGroup?: string | null;
  coachId?: string | null;
}

function classify(value: number | null | undefined, b: PerformanceBand | null): BandColor {
  if (b == null || value == null || isNaN(value as number)) return "unknown";
  const inRange = (lo: number | null, hi: number | null) =>
    lo != null && hi != null && value >= lo && value <= hi;
  if (inRange(b.green_min, b.green_max)) return "green";
  if (inRange(b.yellow_min, b.yellow_max)) return "yellow";
  if (inRange(b.red_min, b.red_max)) return "red";
  if ((b.red_min != null && value < b.red_min) || (b.red_max != null && value > b.red_max)) return "red";
  return "unknown";
}

function pickBest(rows: PerformanceBand[], ctx: Ctx): PerformanceBand | null {
  if (!rows?.length) return null;
  const score = (r: PerformanceBand) => {
    let s = 0;
    if (ctx.coachId && r.coach_id === ctx.coachId) s += 8;
    if (!ctx.coachId && r.coach_id == null) s += 1;
    if (ctx.position && r.position_or_group === ctx.position) s += 4;
    if (ctx.sport && r.sport === ctx.sport) s += 2;
    if (ctx.ageGroup && r.age_group === ctx.ageGroup) s += 2;
    return s;
  };
  return [...rows].sort((a, b) => score(b) - score(a))[0] ?? null;
}

export function useBandClassification(metricKey: string, value: number, ctx: Ctx = {}) {
  const { data, isLoading } = useQuery({
    queryKey: ["ams", "band", metricKey, ctx.coachId ?? null, ctx.position ?? null, ctx.sport ?? null, ctx.ageGroup ?? null],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("performance_bands")
        .select("*")
        .eq("metric_key", metricKey);
      if (error) throw error;
      return (data ?? []) as PerformanceBand[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const bandRow = pickBest(data ?? [], ctx);
  return { band: classify(value, bandRow), bandRow, loading: isLoading };
}
