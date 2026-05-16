import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export interface AcwrRow {
  load_date: string;
  daily_load: number;
  acute_7d: number;
  chronic_28d: number;
  acwr: number | null;
}

interface Params {
  userId: string;
  endDate?: Date;
  metric?: "volume_kg" | "duration_min";
}

export function useAcwrData({ userId, endDate, metric = "volume_kg" }: Params) {
  const endStr = endDate ? format(endDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd");

  const query = useQuery({
    queryKey: ["ams", "acwr", userId, endStr, metric],
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("compute_acwr", {
        p_user_id: userId,
        p_end_date: endStr,
        p_load_metric: metric,
      });
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        load_date: r.load_date,
        daily_load: Number(r.daily_load ?? 0),
        acute_7d: Number(r.acute_7d ?? 0),
        chronic_28d: Number(r.chronic_28d ?? 0),
        acwr: r.acwr == null ? null : Number(r.acwr),
      })) as AcwrRow[];
    },
  });

  return { data: query.data ?? [], isLoading: query.isLoading, error: query.error };
}
