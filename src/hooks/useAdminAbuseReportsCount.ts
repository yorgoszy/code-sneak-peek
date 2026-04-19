import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRoleCheck } from "@/hooks/useRoleCheck";

/**
 * Returns the count of NEW (unacknowledged) abuse reports across the entire system.
 * Used for admin sidebar badge.
 */
export const useAdminAbuseReportsCount = () => {
  const { userProfile, isAdmin } = useRoleCheck();
  const [count, setCount] = useState(0);
  const adminId = userProfile?.id;

  const refresh = async () => {
    if (!adminId || !isAdmin()) {
      setCount(0);
      return;
    }
    try {
      const { data: reports } = await supabase.from("abuse_reports").select("id");
      const reportIds = (reports || []).map((r: any) => r.id);
      if (reportIds.length === 0) {
        setCount(0);
        return;
      }
      const { data: acks } = await supabase
        .from("acknowledged_abuse_reports")
        .select("report_id")
        .eq("user_id", adminId)
        .in("report_id", reportIds);
      const ackSet = new Set((acks || []).map((a: any) => a.report_id));
      setCount(reportIds.filter((id) => !ackSet.has(id)).length);
    } catch (e) {
      console.error("useAdminAbuseReportsCount error:", e);
    }
  };

  useEffect(() => {
    refresh();
    if (!adminId) return;

    const channel = supabase
      .channel(`admin-abuse-count-${adminId}`)
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
  }, [adminId]);

  return { count, refresh };
};
