import React from "react";
import { Badge } from "@/components/ui/badge";
import { useBandClassification } from "@/hooks/ams/useBandClassification";

interface Props {
  value: number;
  metricKey: string;
  athleteId?: string;
  position?: string | null;
  sport?: string | null;
  ageGroup?: string | null;
  coachId?: string | null;
  unit?: string;
}

const COLORS: Record<string, string> = {
  green: "bg-green-100 text-green-800 border-green-300",
  yellow: "bg-yellow-100 text-yellow-800 border-yellow-300",
  red: "bg-red-100 text-red-800 border-red-300",
  unknown: "bg-muted text-muted-foreground border-border",
};

export const BandIndicator: React.FC<Props> = ({ value, metricKey, position, sport, ageGroup, coachId, unit }) => {
  const { band, loading } = useBandClassification(metricKey, value, { position, sport, ageGroup, coachId });
  return (
    <Badge variant="outline" className={`rounded-none border ${COLORS[band]}`}>
      {loading ? "…" : `${value}${unit ? ` ${unit}` : ""}`}
    </Badge>
  );
};
