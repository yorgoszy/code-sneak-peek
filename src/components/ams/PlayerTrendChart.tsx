import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Dot,
} from "recharts";
import { format, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useBandClassification, BandColor } from "@/hooks/ams/useBandClassification";

interface DataPoint { date: string; value: number; }

interface Props {
  userId: string;
  metricKey: string;
  metricLabel: string;
  unit?: string;
  dataFetcher: () => Promise<DataPoint[]>;
  height?: number;
  coachId?: string | null;
  position?: string | null;
  sport?: string | null;
  ageGroup?: string | null;
}

const BAND_HEX: Record<BandColor, string> = {
  green: "#22c55e",
  yellow: "#eab308",
  red: "#ef4444",
  unknown: "#94a3b8",
};

const fmtDate = (s: string) => { try { return format(parseISO(s), "dd MMM"); } catch { return s; } };

const ColoredDot = (props: any) => {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null) return null;
  return <Dot cx={cx} cy={cy} r={3.5} fill={BAND_HEX[(payload?.band as BandColor) ?? "unknown"]} stroke="hsl(var(--background))" strokeWidth={1} />;
};

const TooltipBody = ({ active, payload, label, unit, metricLabel }: any) => {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="bg-background border border-border p-2 text-xs rounded-none shadow">
      <div className="font-semibold">{fmtDate(label)}</div>
      <div>{metricLabel}: {p.value?.toFixed(2)}{unit ? ` ${unit}` : ""}</div>
      <div className="flex items-center gap-1 mt-1">
        <span className="inline-block w-2 h-2" style={{ background: BAND_HEX[p.band as BandColor] }} />
        <span className="capitalize">{p.band}</span>
      </div>
    </div>
  );
};

export const PlayerTrendChart: React.FC<Props> = ({
  userId, metricKey, metricLabel, unit, dataFetcher, height = 320,
  coachId, position, sport, ageGroup,
}) => {
  const { data: raw = [], isLoading } = useQuery({
    queryKey: ["ams", "player-trend", metricKey, userId],
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
    queryFn: dataFetcher,
  });

  // Fetch one band row to classify each point client-side (avoids hook-per-point).
  const { bandRow } = useBandClassification(metricKey, 0, { coachId, position, sport, ageGroup });

  const classifyOne = (value: number): BandColor => {
    if (!bandRow || value == null || isNaN(value)) return "unknown";
    const inRange = (lo: number | null, hi: number | null) =>
      lo != null && hi != null && value >= lo && value <= hi;
    if (inRange(bandRow.green_min, bandRow.green_max)) return "green";
    if (inRange(bandRow.yellow_min, bandRow.yellow_max)) return "yellow";
    if (inRange(bandRow.red_min, bandRow.red_max)) return "red";
    if ((bandRow.red_min != null && value < bandRow.red_min) || (bandRow.red_max != null && value > bandRow.red_max)) return "red";
    return "unknown";
  };

  const data = raw.map((d) => ({ ...d, band: classifyOne(d.value) }));

  return (
    <Card className="rounded-none">
      <CardHeader><CardTitle className="text-base">{metricLabel} trend</CardTitle></CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="w-full" style={{ height }} />
        ) : data.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground border border-dashed border-border">
            No data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="2 4" />
              <XAxis dataKey="date" tickFormatter={fmtDate} fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip content={<TooltipBody unit={unit} metricLabel={metricLabel} />} />
              <Line type="monotone" dataKey="value" stroke="hsl(var(--foreground))" strokeWidth={1.5} dot={<ColoredDot />} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
