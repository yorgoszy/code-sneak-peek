import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  ReferenceLine,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";

interface SessionLike {
  id: string;
  sport?: string | null;
  position_or_group?: string | null;
  relative_distance_m_per_min?: number | null;
  hsr_per_min?: number | null;
  sprint_count?: number | null;
}

interface Props {
  session: SessionLike;
}

interface BandRow {
  metric_key: string;
  sport: string | null;
  position_or_group: string | null;
  green_min: number | null;
  green_max: number | null;
}

const METRICS: Array<{ key: string; label: string; field: keyof SessionLike }> = [
  { key: "relative_distance_m_per_min", label: "m/min", field: "relative_distance_m_per_min" },
  { key: "hsr_per_min", label: "HSR/min", field: "hsr_per_min" },
  { key: "sprints_per_session", label: "Sprints", field: "sprint_count" },
  { key: "rsb_count_per_session", label: "RSBs", field: "id" }, // computed
];

export const DemandComparisonChart: React.FC<Props> = ({ session }) => {
  const sport = session.sport ?? null;
  const position = session.position_or_group ?? null;

  const { data: bands = [] } = useQuery({
    queryKey: ["performance_bands", "demand_compare", sport, position],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("performance_bands")
        .select("metric_key, sport, position_or_group, green_min, green_max")
        .in("metric_key", METRICS.map((m) => m.key));
      if (error) throw error;
      return (data ?? []) as BandRow[];
    },
  });

  const { data: rsbs = [] } = useQuery({
    queryKey: ["detect_rsbs", session.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("detect_rsbs", {
        p_session_id: session.id,
      });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const pickBand = (key: string): BandRow | null => {
    const candidates = bands.filter((b) => b.metric_key === key);
    if (!candidates.length) return null;
    const score = (b: BandRow) =>
      (b.sport === sport ? 2 : 0) + (b.position_or_group === position ? 2 : b.position_or_group == null ? 1 : 0);
    return [...candidates].sort((a, b) => score(b) - score(a))[0];
  };

  const data = METRICS.map((m) => {
    const band = pickBand(m.key);
    const value =
      m.key === "rsb_count_per_session"
        ? rsbs.length
        : ((session as any)[m.field] as number | null | undefined) ?? 0;
    const numValue = Number(value) || 0;
    const inRange =
      band?.green_min != null && band?.green_max != null
        ? numValue >= band.green_min && numValue <= band.green_max
        : null;
    return {
      metric: m.label,
      value: numValue,
      greenMin: band?.green_min ?? null,
      greenMax: band?.green_max ?? null,
      inRange,
    };
  });

  return (
    <Card className="rounded-none">
      <CardContent className="p-4">
        <div className="text-sm font-semibold mb-2">Session vs. reference green-band</div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="metric" />
            <YAxis />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p: any = payload[0].payload;
                return (
                  <div className="bg-background border border-border p-2 text-xs">
                    <div className="font-semibold">{p.metric}</div>
                    <div>Value: {p.value}</div>
                    {p.greenMin != null && (
                      <div>
                        Green: {p.greenMin}–{p.greenMax}
                      </div>
                    )}
                  </div>
                );
              }}
            />
            <Bar dataKey="value">
              {data.map((d, i) => (
                <Cell
                  key={i}
                  fill={
                    d.inRange == null
                      ? "hsl(var(--muted-foreground))"
                      : d.inRange
                      ? "hsl(140 60% 45%)"
                      : "hsl(0 80% 55%)"
                  }
                />
              ))}
            </Bar>
            {data
              .filter((d) => d.greenMax != null)
              .map((d, i) => (
                <ReferenceLine
                  key={`max-${i}`}
                  y={d.greenMax as number}
                  stroke="hsl(140 60% 45%)"
                  strokeDasharray="3 3"
                  ifOverflow="extendDomain"
                />
              ))}
          </BarChart>
        </ResponsiveContainer>
        <div className="text-xs text-muted-foreground mt-2">
          Green bars = within reference green-band. Dashed lines = green-max thresholds per metric.
        </div>
      </CardContent>
    </Card>
  );
};

export default DemandComparisonChart;
