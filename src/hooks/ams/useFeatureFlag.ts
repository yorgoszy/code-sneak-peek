import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useFeatureFlag(flagKey: string) {
  const { data, isLoading } = useQuery({
    queryKey: ["ams", "feature_flag", flagKey],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("feature_flags")
        .select("enabled")
        .eq("flag_key", flagKey)
        .maybeSingle();
      if (error) throw error;
      return !!data?.enabled;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  return { enabled: !!data, loading: isLoading };
}
