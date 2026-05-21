import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceArea,
  Scatter,
} from "recharts";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { useHsrPhaseCurve, HsrPhaseBucket } from "@/hooks/useHsrPhaseCurve";

interface Props {
  athleteId: string;
  fromDate?: Date;
  toDate?: Date;
}

const PHASE_COLORS: Record<HsrPhaseBucket, string> = {
  "off-season": "hsl(200 80% 60%)",
  rehab: "hsl(0 0% 50%)",
  skills: "hsl(45 90% 55%)",
  match: "hsl(140 60% 45%)",
  "worst-case": "hsl(0 80% 55%)",
};

export const HsrPhaseCurveChart: React.FC<Props> = ({ athleteId, fromDate, toDate }) => {
  const { data: sessions = [], isLoading } = useHsrPhaseCurve({
    athleteId,
    fromDate: fromDate ? format(fromDate, "yyyy-MM-dd") : null,
    toDate: toDate ? format(toDate, "yyyy-MM-dd") : null,
  });

  if (isLoading) {
    return <div className="text-sm text-muted-foreground p-4">Loading…</div>;
  }

  const points = sessions
    .filter((s) => s.hsr_per_min != null)
    .map((s) => ({
      date: s.session_date,
      ts: new Date(s.session_date).getTime(),
      hsr: Number(s.hsr_per_min),
      phase: s.phase,
    }));

  const minTs = points.length ? Math.min(...points.map((p) => p.ts)) : Date.now() - 86400000;
  const maxTs = points.length ? Math.max(...points.map((p) => p.ts)) : Date.now();

  return (
    <Card className="rounded-none">
      <CardContent className="p-4">
        <div className="text-sm font-semibold mb-2">HSR Phase Curve (Gabbett 2016)</div>
        <ResponsiveContainer width="100%" height={360}>
          <ComposedChart margin={{ top: 10, right: 20, bottom: 30, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="ts"
              domain={[minTs, maxTs]}
              tickFormatter={(v) => format(new Date(v), "MMM d")}
            />
            <YAxis
              type="number"
              dataKey="hsr"
              domain={[0, 25]}
              label={{ value: "HSR m/min", angle: -90, position: "insideLeft" }}
            />
            <ReferenceArea y1={0} y2={1} fill="hsl(200 80% 60%)" fillOpacity={0.15} label={{ value: "Off-Season", position: "insideTopRight", fontSize: 10 }} />
            <ReferenceArea y1={1} y2={3} fill="hsl(0 0% 50%)" fillOpacity={0.15} label={{ value: "Rehab", position: "insideTopRight", fontSize: 10 }} />
            <ReferenceArea y1={3} y2={7} fill="hsl(45 90% 55%)" fillOpacity={0.15} label={{ value: "Skills", position: "insideTopRight", fontSize: 10 }} />
            <ReferenceArea y1={7} y2={12} fill="hsl(140 60% 45%)" fillOpacity={0.15} label={{ value: "Match", position: "insideTopRight", fontSize: 10 }} />
            <ReferenceArea y1={12} y2={25} fill="hsl(0 80% 55%)" fillOpacity={0.15} label={{ value: "Worst-Case", position: "insideTopRight", fontSize: 10 }} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p: any = payload[0].payload;
                return (
                  <div className="bg-background border border-border p-2 text-xs">
                    <div>{p.date}</div>
                    <div>HSR: {p.hsr.toFixed(1)} m/min</div>
                    <div>Phase: {p.phase}</div>
                  </div>
                );
              }}
            />
            <Scatter
              data={points}
              shape={(props: any) => {
                const { cx, cy, payload } = props;
                return <circle cx={cx} cy={cy} r={5} fill={PHASE_COLORS[payload.phase as HsrPhaseBucket]} stroke="hsl(var(--background))" strokeWidth={1} />;
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default HsrPhaseCurveChart;
