import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getPhaseForDate, type CycleRecord, type PhaseInfo } from "@/utils/cyclePhase";
import { formatDateForStorage } from "@/utils/dateUtils";

/**
 * Fetches gender + menstrual cycles for a user and exposes a getter
 * that returns the cycle phase for a given date. Returns null when
 * the user is not female or no cycle data exists.
 */
export const useUserCyclePhase = (userId: string | null | undefined) => {
  const [isFemale, setIsFemale] = useState(false);
  const [cycles, setCycles] = useState<CycleRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!userId) {
        setIsFemale(false);
        setCycles([]);
        return;
      }
      setLoading(true);
      const { data: profile } = await supabase
        .from("app_users")
        .select("gender")
        .eq("id", userId)
        .maybeSingle();
      if (cancelled) return;
      const female = (profile?.gender || "").toLowerCase() === "female";
      setIsFemale(female);
      if (!female) {
        setCycles([]);
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("menstrual_cycles")
        .select("*")
        .eq("user_id", userId)
        .order("start_date", { ascending: false });
      if (cancelled) return;
      setCycles((data || []) as CycleRecord[]);
      setLoading(false);
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const getPhase = (date: Date): PhaseInfo | null => {
    if (!isFemale || cycles.length === 0) return null;
    return getPhaseForDate(cycles, date);
  };

  const getPhaseByStr = (dateStr: string): PhaseInfo | null => {
    if (!isFemale || cycles.length === 0) return null;
    // dateStr in YYYY-MM-DD
    const [y, m, d] = dateStr.split("-").map(Number);
    return getPhaseForDate(cycles, new Date(y, m - 1, d));
  };

  return { isFemale, cycles, loading, getPhase, getPhaseByStr, formatDateForStorage };
};
