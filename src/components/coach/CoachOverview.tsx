import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { endOfMonth, format, startOfMonth } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";
import { AllUpcomingTestsCard } from "@/components/dashboard/AllUpcomingTestsCard";
import { AllUpcomingCompetitionsCard } from "@/components/dashboard/AllUpcomingCompetitionsCard";
import { CoachSubscriptionDaysCard } from "./CoachSubscriptionDaysCard";
import { TodaysProgramsCard } from "./TodaysProgramsCard";

interface CoachOverviewProps {
  coachId: string;
}

interface Stats {
  totalAthletes: number;
  activeAthletes: number;
  newAthletesThisMonth: number;
}

export const CoachOverview: React.FC<CoachOverviewProps> = ({ coachId }) => {
  const [stats, setStats] = useState<Stats>({
    totalAthletes: 0,
    activeAthletes: 0,
    newAthletesThisMonth: 0,
  });
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (coachId) fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coachId]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
      const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");

      // Athlete stats (from app_users)
      const { count: totalAthletes } = await supabase
        .from("app_users")
        .select("*", { count: "exact", head: true })
        .eq("coach_id", coachId);

      const { count: activeAthletes } = await supabase
        .from("app_users")
        .select("*", { count: "exact", head: true })
        .eq("coach_id", coachId)
        .eq("user_status", "active");

      const { count: newAthletesThisMonth } = await supabase
        .from("app_users")
        .select("*", { count: "exact", head: true })
        .eq("coach_id", coachId)
        .gte("created_at", monthStart)
        .lte("created_at", monthEnd);

      setStats({
        totalAthletes: totalAthletes || 0,
        activeAthletes: activeAthletes || 0,
        newAthletesThisMonth: newAthletesThisMonth || 0,
      });
    } catch (error) {
      console.error("Error fetching coach overview:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="text-gray-500">Φόρτωση...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Επισκόπηση</h2>

      {/* Row 1: Stats cards (3 stats + HYPERsync days) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
        <Card className="rounded-none">
          <CardHeader className={`flex flex-row items-center justify-between space-y-0 ${isMobile ? "pb-1 px-2 pt-2" : "pb-2"}`}>
            <CardTitle className={`${isMobile ? "text-[10px]" : "text-sm"} font-medium leading-tight`}>
              Συνολικοί Αθλητές
            </CardTitle>
            <Users className={`${isMobile ? "h-3 w-3" : "h-4 w-4"} text-black flex-shrink-0`} />
          </CardHeader>
          <CardContent className={`${isMobile ? "pt-0 px-2 pb-2" : ""}`}>
            <div className={`${isMobile ? "text-base" : "text-2xl"} font-bold`}>{stats.totalAthletes}</div>
          </CardContent>
        </Card>

        <Card className="rounded-none">
          <CardHeader className={`flex flex-row items-center justify-between space-y-0 ${isMobile ? "pb-1 px-2 pt-2" : "pb-2"}`}>
            <CardTitle className={`${isMobile ? "text-[10px]" : "text-sm"} font-medium leading-tight`}>
              Ενεργοί Αθλητές
            </CardTitle>
            <Activity className={`${isMobile ? "h-3 w-3" : "h-4 w-4"} text-black flex-shrink-0`} />
          </CardHeader>
          <CardContent className={`${isMobile ? "pt-0 px-2 pb-2" : ""}`}>
            <div className={`${isMobile ? "text-base" : "text-2xl"} font-bold`}>{stats.activeAthletes}</div>
          </CardContent>
        </Card>

        <Card className="rounded-none">
          <CardHeader className={`flex flex-row items-center justify-between space-y-0 ${isMobile ? "pb-1 px-2 pt-2" : "pb-2"}`}>
            <CardTitle className={`${isMobile ? "text-[10px]" : "text-sm"} font-medium leading-tight`}>
              Νέοι Αθλητές
            </CardTitle>
            <Users className={`${isMobile ? "h-3 w-3" : "h-4 w-4"} text-black flex-shrink-0`} />
          </CardHeader>
          <CardContent className={`${isMobile ? "pt-0 px-2 pb-2" : ""}`}>
            <div className={`${isMobile ? "text-base" : "text-2xl"} font-bold`}>{stats.newAthletesThisMonth}</div>
            {!isMobile && <p className="text-xs text-gray-500 mt-1">Αυτόν τον μήνα</p>}
          </CardContent>
        </Card>

        {/* HYPERsync subscription days */}
        <CoachSubscriptionDaysCard coachId={coachId} />
      </div>

      {/* Row 2: Today's Programs + Upcoming Tests + Upcoming Competitions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TodaysProgramsCard coachId={coachId} />
        <AllUpcomingTestsCard coachId={coachId} />
        <AllUpcomingCompetitionsCard coachId={coachId} />
      </div>
    </div>
  );
};
