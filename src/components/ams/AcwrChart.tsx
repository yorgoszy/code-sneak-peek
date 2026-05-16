import React from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAcwrData } from "@/hooks/ams/useAcwrData";
import { BandIndicator } from "@/components/ams/BandIndicator";

interface Props {
  userId: string;
  height?: number;
  metric?: "volume_kg" | "duration_min";
  endDate?: Date;
}

const fmtDate = (s: string) => {
  try { return format(parseISO(s), "dd MMM"); } catch { return s; }
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="bg-background border border-border p-2 text-xs rounded-none shadow">
      <div className="font-semibold mb-1">{fmtDate(label)}</div>
      <div>Daily load: {row.daily_load?.toFixed(0)}</div>
      <div>7-day acute: {row.acute_7d?.toFixed(0)}</div>
      <div>28-day chronic: {row.chronic_28d?.toFixed(0)}</div>
      <div className="mt-1 flex items-center gap-2">
        <span>ACWR:</span>
        {row.acwr != null ? (
          <BandIndicator value={Number(row.acwr.toFixed(2))} metricKey="acwr" />
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </div>
    </div>
  );
};

export const AcwrChart: React.FC<Props> = ({ userId, height = 380, metric = "volume_kg", endDate }) => {
  const { data, isLoading } = useAcwrData({ userId, endDate, metric });

  if (isLoading) {
    return (
      <Card className="rounded-none">
        <CardHeader><CardTitle className="text-base">ACWR</CardTitle></CardHeader>
        <CardContent><Skeleton className="w-full" style={{ height }} /></CardContent>
      </Card>
    );
  }

  const hasData = data.some((d) => d.daily_load > 0 || d.acwr != null);

  return (
    <Card className="rounded-none">
      <CardHeader>
        <CardTitle className="text-base">Acute:Chronic Workload Ratio</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="text-center py-12 text-sm text-muted-foreground border border-dashed border-border">
            No workout data in the last 60 days
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            <ComposedChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="2 4" />
              <XAxis dataKey="load_date" tickFormatter={fmtDate} fontSize={11} />
              <YAxis yAxisId="left" domain={[0, 2]} fontSize={11} label={{ value: "ACWR", angle: -90, position: "insideLeft", fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" fontSize={11} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />

              {/* Band areas (left axis) */}
              <ReferenceArea yAxisId="left" y1={0} y2={0.5} fill="#ef4444" fillOpacity={0.08} />
              <ReferenceArea yAxisId="left" y1={0.5} y2={0.8} fill="#eab308" fillOpacity={0.1} />
              <ReferenceArea yAxisId="left" y1={0.8} y2={1.3} fill="#22c55e" fillOpacity={0.12} />
              <ReferenceArea yAxisId="left" y1={1.3} y2={1.5} fill="#eab308" fillOpacity={0.1} />
              <ReferenceArea yAxisId="left" y1={1.5} y2={2} fill="#ef4444" fillOpacity={0.08} />

              <ReferenceLine yAxisId="left" y={0.8} stroke="#22c55e" strokeDasharray="4 4" />
              <ReferenceLine yAxisId="left" y={1.3} stroke="#22c55e" strokeDasharray="4 4" />

              <Bar yAxisId="right" dataKey="acute_7d" name="7-day acute load" fill="#93c5fd" />
              <Line yAxisId="left" type="monotone" dataKey="acwr" name="ACWR" stroke="hsl(var(--foreground))" strokeWidth={2.5} dot={false} connectNulls />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
