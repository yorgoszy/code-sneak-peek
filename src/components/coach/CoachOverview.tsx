import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Calendar, ClipboardList, Dumbbell, Trophy, UserPlus, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { differenceInCalendarDays, endOfMonth, format, startOfMonth } from "date-fns";
import { el } from "date-fns/locale";
import { useIsMobile } from "@/hooks/use-mobile";

interface CoachOverviewProps {
  coachId: string;
}

interface Stats {
  totalAthletes: number;
  activeAthletes: number;
  newAthletesThisMonth: number;
  todaysPrograms: number;
}

interface UpcomingEvent {
  date: string;
  userName: string;
  userId: string;
  programName?: string;
  dayName?: string;
  testTypes?: string[];
}

export const CoachOverview: React.FC<CoachOverviewProps> = ({ coachId }) => {
  const [stats, setStats] = useState<Stats>({
    totalAthletes: 0,
    activeAthletes: 0,
    newAthletesThisMonth: 0,
    todaysPrograms: 0,
  });
  const [upcomingTests, setUpcomingTests] = useState<UpcomingEvent[]>([]);
  const [upcomingCompetitions, setUpcomingCompetitions] = useState<UpcomingEvent[]>([]);
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

      // 2) Active assignments for this coach (by assigner/coach_id)
      // NOTE: Δεν βασιζόμαστε στο app_users.coach_id του αθλητή, αλλά στο ποιος έκανε την ανάθεση.
      const { data: assignments, error: assignmentsError } = await supabase
        .from("program_assignments")
        .select("id, user_id, program_id, training_dates")
        .eq("status", "active")
        .not("training_dates", "is", null)
        .or(`assigned_by.eq.${coachId},coach_id.eq.${coachId}`);

      if (assignmentsError) {
        console.error("❌ Error fetching assignments:", assignmentsError);
        throw assignmentsError;
      }

      console.log("✅ Assignments fetched for coach (assigned_by/coach_id):", assignments?.length);

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

      // 5) Fetch programs with nested weeks and days
      let programById = new Map<string, any>();
      if (programIds.length > 0) {
        const { data: programsData, error: programsError } = await supabase
          .from("programs")
          .select(`
            id,
            name,
            program_weeks (
              id,
              week_number,
              program_days (
                id,
                name,
                day_number,
                is_test_day,
                test_types,
                is_competition_day
              )
            )
          `)
          .in("id", programIds);

        if (programsError) {
          console.error("❌ Error fetching programs:", programsError);
        } else {
          console.log("✅ Programs fetched:", programsData?.length);
          programById = new Map<string, any>((programsData || []).map((p: any) => [p.id, p]));
        }
      }

      // 6) Compute upcoming events
      const tests: UpcomingEvent[] = [];
      const competitions: UpcomingEvent[] = [];

      (assignments || []).forEach((assignment: any) => {
        const trainingDates: string[] = assignment.training_dates || [];
        const program = programById.get(assignment.program_id);
        if (!program) return;

        const weeks = program.program_weeks || [];
        if (!weeks.length) return;

        // Sort weeks by week_number
        const sortedWeeks = [...weeks].sort((a: any, b: any) => a.week_number - b.week_number);

        const userName = userNameById.get(assignment.user_id) || "";

        let dateIndex = 0;
        sortedWeeks.forEach((week: any) => {
          const sortedDays = [...(week.program_days || [])].sort((a: any, b: any) => a.day_number - b.day_number);
          
          sortedDays.forEach((day: any) => {
            if (dateIndex >= trainingDates.length) return;
            const dateStr = trainingDates[dateIndex];
            dateIndex++;

            if (!dateStr || dateStr < todayStr) return;

            // Check both is_test_day flag AND if test_types array has values
            const hasTestTypes = day?.test_types && Array.isArray(day.test_types) && day.test_types.length > 0;
            if (day.is_test_day || hasTestTypes) {
              tests.push({
                date: dateStr,
                userName,
                userId: assignment.user_id,
                programName: program?.name,
                dayName: day?.name,
                testTypes: day?.test_types || [],
              });
            }

            if (day.is_competition_day) {
              competitions.push({
                date: dateStr,
                userName,
                userId: assignment.user_id,
                programName: program?.name,
                dayName: day?.name,
              });
            }
          });
        });
      });

      console.log("✅ Tests found:", tests.length, "Competitions found:", competitions.length);

      tests.sort((a, b) => a.date.localeCompare(b.date));
      competitions.sort((a, b) => a.date.localeCompare(b.date));

      setUpcomingTests(tests);
      setUpcomingCompetitions(competitions);
      setStats({
        totalAthletes: totalAthletes || 0,
        activeAthletes: activeAthletes || 0,
        newAthletesThisMonth: newAthletesThisMonth || 0,
        todaysPrograms,
      });
    } catch (error) {
      console.error("Error fetching coach overview:", error);
      setUpcomingTests([]);
      setUpcomingCompetitions([]);
    } finally {
      setLoading(false);
    }
  };

  const getDaysLeftText = (dateStr: string) => {
    const daysLeft = differenceInCalendarDays(new Date(dateStr), new Date());
    return daysLeft === 0 ? "σήμερα" : daysLeft === 1 ? "αύριο" : `σε ${daysLeft} μέρες`;
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="rounded-none">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-sm">
              <ClipboardList className="h-4 w-4 mr-2 text-orange-600" />
              Επερχόμενα Τεστ ({upcomingTests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingTests.length === 0 ? (
              <div className="text-center py-4 text-gray-500 text-sm">Δεν υπάρχουν επερχόμενα τεστ</div>
            ) : (
              <div className="space-y-2 max-h-[250px] overflow-y-auto">
                {upcomingTests.slice(0, 8).map((test, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200">
                    <div className="flex items-center gap-2 min-w-0">
                      <Calendar className="h-3 w-3 text-orange-600 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-xs truncate">{test.userName}</p>
                        <p className="text-[10px] text-gray-500">{format(new Date(test.date), "d MMM", { locale: el })}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {test.testTypes && test.testTypes.length > 0 && (
                        <p className="text-[10px] font-medium text-gray-700 truncate max-w-[110px]">{test.testTypes.slice(0, 2).join(", ")}</p>
                      )}
                      <p className="text-[10px] text-orange-600 font-medium">{getDaysLeftText(test.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-none">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-sm">
              <Trophy className="h-4 w-4 mr-2 text-[#cb8954]" />
              Επερχόμενοι Αγώνες ({upcomingCompetitions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingCompetitions.length === 0 ? (
              <div className="text-center py-4 text-gray-500 text-sm">Δεν υπάρχουν επερχόμενοι αγώνες</div>
            ) : (
              <div className="space-y-2 max-h-[250px] overflow-y-auto">
                {upcomingCompetitions.slice(0, 8).map((comp, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200">
                    <div className="flex items-center gap-2 min-w-0">
                      <Calendar className="h-3 w-3 text-[#cb8954] flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-xs truncate">{comp.userName}</p>
                        <p className="text-[10px] text-gray-500">{format(new Date(comp.date), "d MMM", { locale: el })}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {comp.dayName && <p className="text-[10px] text-gray-600 italic truncate max-w-[110px]">{comp.dayName}</p>}
                      <p className="text-[10px] text-[#cb8954] font-medium">{getDaysLeftText(comp.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
