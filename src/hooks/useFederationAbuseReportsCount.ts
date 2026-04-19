import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Returns the count of NEW (unacknowledged) abuse reports for the federation's coaches.
 */
export const useFederationAbuseReportsCount = (federationId?: string) => {
  const [count, setCount] = useState(0);

  const refresh = async () => {
    if (!federationId) {
      setCount(0);
      return;
    }
    try {
      const { data: clubs } = await supabase
        .from("federation_clubs")
        .select("club_id")
        .eq("federation_id", federationId);

      const coachIds = (clubs || []).map((c: any) => c.club_id);
      if (coachIds.length === 0) {
        setCount(0);
        return;
      }

      const { data: reports } = await supabase
        .from("abuse_reports")
        .select("id")
        .in("coach_id", coachIds);

      const reportIds = (reports || []).map((r: any) => r.id);
      if (reportIds.length === 0) {
        setCount(0);
        return;
      }

      const { data: acks } = await supabase
        .from("acknowledged_abuse_reports")
        .select("report_id")
        .eq("user_id", federationId)
        .in("report_id", reportIds);

      const ackSet = new Set((acks || []).map((a: any) => a.report_id));
      setCount(reportIds.filter((id) => !ackSet.has(id)).length);
    } catch (e) {
      console.error("useFederationAbuseReportsCount error:", e);
    }
  };

  useEffect(() => {
    refresh();

    if (!federationId) return;

    // Realtime subscription on acknowledgements + reports
    const channel = supabase
      .channel(`abuse-count-${federationId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "abuse_reports" }, refresh)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "acknowledged_abuse_reports" },
        refresh
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [federationId]);

  return { count, refresh };
};
