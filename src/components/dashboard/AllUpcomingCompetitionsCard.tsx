import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, differenceInCalendarDays } from "date-fns";
import { el } from "date-fns/locale";

interface UpcomingCompetition {
  date: string;
  userName?: string;
  userId?: string;
  programName?: string;
  dayName?: string;
}

export const AllUpcomingCompetitionsCard = () => {
  const [upcomingCompetitions, setUpcomingCompetitions] = useState<UpcomingCompetition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllUpcomingCompetitions();
  }, []);

  const fetchAllUpcomingCompetitions = async () => {
    try {
      setLoading(true);
      const todayStr = format(new Date(), 'yyyy-MM-dd');

      // Fetch all active program assignments
      const { data: assignments, error: assignmentsError } = await supabase
        .from('program_assignments')
        .select(`
          id,
          user_id,
          program_id,
          training_dates,
          status,
          app_users!program_assignments_user_id_fkey (
            id,
            name
          ),
          programs!program_assignments_program_id_fkey (
            id,
            name,
            program_weeks!fk_program_weeks_program_id (
              id,
              week_number,
              program_days!fk_program_days_week_id (
                id,
                name,
                day_number,
                is_competition_day
              )
            )
          )
        `)
        .eq('status', 'active');

      if (assignmentsError) {
        console.error('Error fetching assignments:', assignmentsError);
        return;
      }

      const competitions: UpcomingCompetition[] = [];

      // Process each assignment mapping dates across ALL program weeks/days
      for (const assignment of assignments || []) {
        const trainingDates = assignment.training_dates || [];
        const programRaw = Array.isArray(assignment.programs) ? assignment.programs[0] : assignment.programs;
        const user = Array.isArray(assignment.app_users) ? assignment.app_users[0] : assignment.app_users;

        const weeks = (programRaw?.program_weeks || [])
          .slice()
          .sort((a: any, b: any) => (a.week_number || 0) - (b.week_number || 0));

        if (weeks.length === 0) continue;

        const weeksDays: any[][] = weeks.map((w: any) =>
          (w.program_days || []).slice().sort((a: any, b: any) => (a.day_number || 0) - (b.day_number || 0))
        );

        const cycleLength = weeksDays.reduce((sum, days) => sum + days.length, 0);
        if (cycleLength === 0) continue;

        // Check each training date and find its corresponding week/day in the cycle
        trainingDates.forEach((dateStr: string, index: number) => {
          // Skip past dates
          if (dateStr < todayStr) return;

          const idxInCycle = index % cycleLength;
          let acc = 0;
          let foundWeekIndex = 0;
          let foundDayIndex = 0;
          for (let wi = 0; wi < weeksDays.length; wi++) {
            const len = weeksDays[wi].length;
            if (idxInCycle < acc + len) {
              foundWeekIndex = wi;
              foundDayIndex = idxInCycle - acc;
              break;
            }
            acc += len;
          }

          const day = weeksDays[foundWeekIndex]?.[foundDayIndex];

          // If this day is marked as competition day, add it to the list
          if (day?.is_competition_day) {
            competitions.push({
              date: dateStr,
              userName: user?.name,
              userId: user?.id,
              programName: programRaw?.name,
              dayName: day.name
            });
          }
        });
      }

      // Sort by date ascending
      competitions.sort((a, b) => a.date.localeCompare(b.date));

      console.log('✅ Found upcoming competitions:', competitions);
      setUpcomingCompetitions(competitions);
    } catch (error) {
      console.error('Error fetching all upcoming competitions:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="rounded-none">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Trophy className="h-5 w-5 mr-2 text-[#cb8954]" />
          Επερχόμενοι Αγώνες
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-gray-500">
            <p>Φόρτωση...</p>
          </div>
        ) : upcomingCompetitions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Trophy className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>Δεν υπάρχουν επερχόμενοι αγώνες</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {upcomingCompetitions.map((comp, idx) => (
            <div 
              key={idx}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-none border border-gray-200"
            >
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-[#cb8954]" />
                <div>
                  <p className="font-medium text-sm">
                    {format(new Date(comp.date), 'EEEE, d MMMM', { locale: el })}
                  </p>
                  {comp.userName && (
                    <p className="text-xs text-gray-600">{comp.userName}</p>
                  )}
                  {comp.dayName && (
                    <p className="text-xs text-gray-500 italic">{comp.dayName}</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                {comp.programName && (
                  <p className="text-xs font-medium text-gray-900">{comp.programName}</p>
                )}
                <p className="text-xs text-gray-600">
                  {(() => {
                    const daysLeft = differenceInCalendarDays(new Date(comp.date), new Date());
                    return daysLeft === 0 ? 'σήμερα' : daysLeft === 1 ? 'αύριο' : `σε ${daysLeft} μέρες`;
                  })()}
                </p>
              </div>
            </div>
          ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
