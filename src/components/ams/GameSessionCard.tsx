import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BandIndicator } from "@/components/ams/BandIndicator";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface GameSessionLike {
  id: string;
  athlete_id: string;
  session_date: string;
  session_type: string;
  sport?: string | null;
  position_or_group?: string | null;
  duration_min: number;
  relative_distance_m_per_min?: number | null;
  hsr_per_min?: number | null;
  sprint_count?: number | null;
}

interface Props {
  session: GameSessionLike;
  onClick?: () => void;
}

export const GameSessionCard: React.FC<Props> = ({ session, onClick }) => {
  const { data: rsbs = [] } = useQuery({
    queryKey: ["detect_rsbs", session.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("detect_rsbs", {
        p_session_id: session.id,
      });
      if (error) throw error;
      return (data ?? []) as any[];
    },
    staleTime: 5 * 60 * 1000,
  });

  return (
    <Card
      className="rounded-none cursor-pointer hover:bg-accent/40 transition-colors"
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">{session.session_date}</div>
          <Badge variant="outline" className="rounded-none">
            {session.session_type}
          </Badge>
        </div>
        <div className="text-xs text-muted-foreground">
          {session.duration_min} min{session.sport ? ` · ${session.sport}` : ""}
          {session.position_or_group ? ` · ${session.position_or_group}` : ""}
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          {session.relative_distance_m_per_min != null && (
            <BandIndicator
              value={Number(Number(session.relative_distance_m_per_min).toFixed(1))}
              metricKey="relative_distance_m_per_min"
              sport={session.sport ?? null}
              position={session.position_or_group ?? null}
              unit="m/min"
            />
          )}
          {session.hsr_per_min != null && (
            <BandIndicator
              value={Number(Number(session.hsr_per_min).toFixed(1))}
              metricKey="hsr_per_min"
              sport={session.sport ?? null}
              position={session.position_or_group ?? null}
              unit="HSR/min"
            />
          )}
          {session.sprint_count != null && (
            <Badge variant="outline" className="rounded-none">
              {session.sprint_count} sprints
            </Badge>
          )}
          <Badge variant="outline" className="rounded-none">
            {rsbs.length} RSB
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default GameSessionCard;
