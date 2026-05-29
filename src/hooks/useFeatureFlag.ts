import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useFeatureFlag(flagKey: string): { enabled: boolean; loading: boolean } {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("feature_flags")
        .select("enabled")
        .eq("flag_key", flagKey)
        .maybeSingle();
      if (!cancelled) {
        setEnabled(!!data?.enabled);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [flagKey]);

  return { enabled, loading };
}
