import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Dumbbell, UserPlus, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { endOfMonth, format, startOfMonth } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";
import { AllUpcomingTestsCard } from "@/components/dashboard/AllUpcomingTestsCard";
import { AllUpcomingCompetitionsCard } from "@/components/dashboard/AllUpcomingCompetitionsCard";

interface CoachOverviewProps {
  coachId: string;
}

interface Stats {
  totalAthletes: number;
  activeAthletes: number;
  newAthletesThisMonth: number;
  todaysPrograms: number;
}

export const CoachOverview: React.FC<CoachOverviewProps> = ({ coachId }) => {
  const [stats, setStats] = useState<Stats>({
    totalAthletes: 0,
    activeAthletes: 0,
    newAthletesThisMonth: 0,
    todaysPrograms: 0,
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
      const todayStr = format(new Date(), "yyyy-MM-dd");
      const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
      const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");

      // 1) Athlete stats (from app_users)
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

      // 2) Active assignments relevant to this coach
      // Στόχος: να εμφανίζονται σωστά τα upcoming tests/competitions στο coach dashboard.
      // Για να καλύψουμε και legacy δεδομένα (NULL assigned_by/coach_id), κάνουμε “ένωση” από 4 πηγές:
      // A) assigned_by = coachId
      // B) coach_id = coachId
      // C) assignments των αθλητών που έχουν app_users.coach_id = coachId
      // D) assignments για προγράμματα που ανήκουν στον coach (programs.coach_id = coachId)

      const baseAssignmentsQuery = supabase
        .from("program_assignments")
        .select("id, user_id, program_id, training_dates, assigned_by, coach_id")
        .eq("status", "active")
        .not("training_dates", "is", null);

      const [byAssignerRes, coachAthletesRes, coachProgramsRes] = await Promise.all([
        baseAssignmentsQuery.or(`assigned_by.eq.${coachId},coach_id.eq.${coachId}`),
        supabase.from("app_users").select("id").eq("coach_id", coachId),
        supabase.from("programs").select("id").eq("coach_id", coachId),
      ]);

      if (byAssignerRes.error) {
        console.error("❌ Error fetching assignments (by assigner/coach_id):", byAssignerRes.error);
        throw byAssignerRes.error;
      }

      const athleteIds = (coachAthletesRes.data || []).map((u: any) => u.id).filter(Boolean);
      const coachProgramIds = (coachProgramsRes.data || []).map((p: any) => p.id).filter(Boolean);

      const [byAthletesRes, byProgramsRes] = await Promise.all([
        athleteIds.length > 0 ? baseAssignmentsQuery.in("user_id", athleteIds) : Promise.resolve({ data: [], error: null } as any),
        coachProgramIds.length > 0 ? baseAssignmentsQuery.in("program_id", coachProgramIds) : Promise.resolve({ data: [], error: null } as any),
      ]);

      if (byAthletesRes.error) {
        console.error("❌ Error fetching assignments (by athletes):", byAthletesRes.error);
        throw byAthletesRes.error;
      }

      if (byProgramsRes.error) {
        console.error("❌ Error fetching assignments (by programs):", byProgramsRes.error);
        throw byProgramsRes.error;
      }

      // Merge + de-dupe
      const merged = [...(byAssignerRes.data || []), ...(byAthletesRes.data || []), ...(byProgramsRes.data || [])];
      const dedupedMap = new Map<string, any>();
      merged.forEach((a: any) => {
        if (a?.id) dedupedMap.set(a.id, a);
      });
      const assignments = Array.from(dedupedMap.values());

      console.log("✅ Assignments fetched for coach (merged):", assignments.length);

      const userIds = Array.from(new Set((assignments || []).map((a: any) => a.user_id).filter(Boolean)));
      const programIds = Array.from(new Set((assignments || []).map((a: any) => a.program_id).filter(Boolean)));

      // 3) Today programs count
      const todaysPrograms = (assignments || []).filter((a: any) => (a.training_dates || []).includes(todayStr)).length;

      // 4) Build lookup maps - fetch users
      let userNameById = new Map<string, string>();
      if (userIds.length > 0) {
        const { data: usersData } = await supabase
          .from("app_users")
          .select("id, name")
          .in("id", userIds);
        userNameById = new Map<string, string>((usersData || []).map((u: any) => [u.id, u.name]));
      }

      // Απλώς κρατάμε τα stats - τα upcoming tests/competitions τα δείχνουμε μέσω των admin components
      setStats({
        totalAthletes: totalAthletes || 0,
        activeAthletes: activeAthletes || 0,
        newAthletesThisMonth: newAthletesThisMonth || 0,
        todaysPrograms,
      });
    } catch (error) {
      console.error("Error fetching coach overview:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = useMemo(
    () => [
      { title: "Συνολικοί Αθλητές", value: stats.totalAthletes, icon: Users, color: "text-blue-600" },
      { title: "Ενεργοί Αθλητές", value: stats.activeAthletes, icon: Activity, color: "text-[#00ffba]" },
      { title: "Νέοι Αθλητές", subtitle: "Αυτόν τον μήνα", value: stats.newAthletesThisMonth, icon: UserPlus, color: "text-green-600" },
      { title: "Σημερινά Προγράμματα", value: stats.todaysPrograms, icon: Dumbbell, color: "text-purple-600" },
    ],
    [stats]
  );

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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
        {statCards.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Card key={index} className="rounded-none">
              <CardHeader className={`flex flex-row items-center justify-between space-y-0 ${isMobile ? "pb-1 px-2 pt-2" : "pb-2"}`}>
                <CardTitle className={`${isMobile ? "text-[10px]" : "text-sm"} font-medium leading-tight`}>
                  {stat.title}
                </CardTitle>
                <IconComponent className={`${isMobile ? "h-3 w-3" : "h-4 w-4"} ${stat.color} flex-shrink-0`} />
              </CardHeader>
              <CardContent className={`${isMobile ? "pt-0 px-2 pb-2" : ""}`}>
                <div className={`${isMobile ? "text-base" : "text-2xl"} font-bold`}>{stat.value}</div>
                {stat.subtitle && !isMobile && <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Χρησιμοποιούμε τα ίδια components με τον admin - με φιλτράρισμα για τον coach */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AllUpcomingTestsCard coachId={coachId} />
        <AllUpcomingCompetitionsCard coachId={coachId} />
      </div>
    </div>
  );
};
