import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceArea,
  CartesianGrid,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  sessionId: string;
}

interface SprintRow {
  id: string;
  sprint_start_seconds: number;
  sprint_duration_sec: number;
  sprint_distance_m: number | null;
  max_speed_kmh: number | null;
}

interface RsbRow {
  rsb_index: number;
  sprint_count: number;
  total_duration_sec: number;
  mean_recovery_sec: number;
  work_rest_ratio: number | null;
  first_sprint_start_sec: number;
}

export const RsbTimelineChart: React.FC<Props> = ({ sessionId }) => {
  const { data: sprints = [], isLoading } = useQuery({
    queryKey: ["sprint_efforts", sessionId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("sprint_efforts")
        .select("id, sprint_start_seconds, sprint_duration_sec, sprint_distance_m, max_speed_kmh")
        .eq("game_session_id", sessionId)
        .order("sprint_start_seconds", { ascending: true });
      if (error) throw error;
      return (data ?? []) as SprintRow[];
    },
  });

  const { data: rsbs = [] } = useQuery({
    queryKey: ["detect_rsbs", sessionId],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("detect_rsbs", {
        p_session_id: sessionId,
      });
      if (error) throw error;
      return (data ?? []) as RsbRow[];
    },
  });

  if (isLoading) {
    return <div className="text-sm text-muted-foreground p-4">Loading…</div>;
  }

  if (!sprints.length) {
    return (
      <Card className="rounded-none">
        <CardContent className="p-6 text-sm text-muted-foreground text-center">
          No sprint efforts recorded for this session.
        </CardContent>
      </Card>
    );
  }

  const points = sprints.map((s, i) => ({
    x: Number(s.sprint_start_seconds),
    y: 1,
    idx: i + 1,
    dur: Number(s.sprint_duration_sec),
    speed: s.max_speed_kmh,
  }));

  const maxX = Math.max(...sprints.map((s) => Number(s.sprint_start_seconds) + Number(s.sprint_duration_sec))) + 10;

  return (
    <Card className="rounded-none">
      <CardContent className="p-4">
        <div className="text-sm font-semibold mb-2">Sprint timeline & RSB regions</div>
        <ResponsiveContainer width="100%" height={180}>
          <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="x"
              name="seconds"
              domain={[0, maxX]}
              label={{ value: "seconds", position: "insideBottom", offset: -5 }}
            />
            <YAxis type="number" dataKey="y" domain={[0, 2]} hide />
            {rsbs.map((r) => (
              <ReferenceArea
                key={r.rsb_index}
                x1={Number(r.first_sprint_start_sec)}
                x2={Number(r.first_sprint_start_sec) + Number(r.total_duration_sec)}
                y1={0}
                y2={2}
                strokeOpacity={0.3}
                fill="hsl(0 80% 55%)"
                fillOpacity={0.15}
              />
            ))}
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p: any = payload[0].payload;
                return (
                  <div className="bg-background border border-border p-2 text-xs">
                    <div>Sprint #{p.idx}</div>
                    <div>Start: {p.x}s · Duration: {p.dur}s</div>
                    {p.speed != null && <div>Max speed: {p.speed} km/h</div>}
                  </div>
                );
              }}
            />
            <Scatter data={points} fill="hsl(25 95% 53%)" shape="square" />
          </ScatterChart>
        </ResponsiveContainer>
        <div className="text-xs text-muted-foreground mt-2">
          Orange squares = sprints · Red bands = detected RSBs (≥3 sprints, mean recovery ≤21s)
        </div>
      </CardContent>
    </Card>
  );
};

export default RsbTimelineChart;
