import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type HsrPhaseBucket = 'off-season' | 'rehab' | 'skills' | 'match' | 'worst-case';

export interface HsrPhaseSession {
  id: string;
  athlete_id: string;
  session_date: string;
  session_type: string;
  duration_min: number;
  hsr_distance_m: number | null;
  hsr_per_min: number | null;
  phase: HsrPhaseBucket;
}

export const getHsrPhaseBucket = (hsrPerMin: number | null | undefined): HsrPhaseBucket => {
  const v = hsrPerMin ?? 0;
  if (v < 1) return 'off-season';
  if (v < 3) return 'rehab';
  if (v < 7) return 'skills';
  if (v <= 12) return 'match';
  return 'worst-case';
};

interface Params {
  athleteId?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
}

export const useHsrPhaseCurve = ({ athleteId, fromDate, toDate }: Params) => {
  return useQuery({
    queryKey: ['hsr-phase-curve', athleteId, fromDate, toDate],
    enabled: !!athleteId,
    queryFn: async (): Promise<HsrPhaseSession[]> => {
      let q = supabase
        .from('game_sessions')
        .select('id, athlete_id, session_date, session_type, duration_min, hsr_distance_m, hsr_per_min')
        .eq('athlete_id', athleteId!)
        .order('session_date', { ascending: true });

      if (fromDate) q = q.gte('session_date', fromDate);
      if (toDate) q = q.lte('session_date', toDate);

      const { data, error } = await q;
      if (error) throw error;

      return (data || []).map((s: any) => ({
        ...s,
        phase: getHsrPhaseBucket(s.hsr_per_min),
      }));
    },
  });
};
