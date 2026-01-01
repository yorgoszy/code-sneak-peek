import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Trophy } from "lucide-react";
import { useState, useEffect } from "react";
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

interface AllUpcomingCompetitionsCardProps {
  coachId?: string; // Αν δοθεί, φιλτράρει μόνο τα assignments του coach
}

export const AllUpcomingCompetitionsCard = ({ coachId }: AllUpcomingCompetitionsCardProps) => {
  const [upcomingCompetitions, setUpcomingCompetitions] = useState<UpcomingCompetition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    fetchAllUpcomingCompetitions();
  }, [coachId]);

  const fetchAllUpcomingCompetitions = async () => {
    try {
      setIsLoading(true);
      const comps: UpcomingCompetition[] = [];

      // Φόρτωση assignments με φιλτράρισμα
      let assignmentsQuery = supabase
        .from('program_assignments')
        .select(`
          id,
          training_dates,
          coach_id,
          assigned_by,
          programs!fk_program_assignments_program_id (
            id,
            name,
            program_weeks!fk_program_weeks_program_id (
              id,
              week_number,
              program_days!fk_program_days_week_id (
                id,
                day_number,
                name,
                is_competition_day
              )
            )
          ),
          app_users!fk_program_assignments_user_id (id, name)
        `)
        .in('status', ['active', 'completed'])
        .gte('end_date', todayStr);

      // Φιλτράρισμα με βάση coachId
      if (coachId) {
        // Coach βλέπει μόνο τα δικά του assignments
        assignmentsQuery = assignmentsQuery.or(`coach_id.eq.${coachId},assigned_by.eq.${coachId}`);
      } else {
        // Admin βλέπει μόνο τα assignments χωρίς coach (δικά του)
        assignmentsQuery = assignmentsQuery.is('coach_id', null);
      }

      const { data: assignments, error } = await assignmentsQuery;

      if (!error && assignments) {
        for (const assignment of assignments as any[]) {
          const trainingDates = assignment.training_dates || [];
          const program = assignment.programs;
          const user = assignment.app_users;
          const weeks = program?.program_weeks || [];
          if (!weeks?.length) continue;

          const daysPerWeek = weeks[0]?.program_days?.length || 0;
          if (!daysPerWeek) continue;

          weeks.forEach((week: any, weekIndex: number) => {
            (week.program_days || []).forEach((day: any, dayIndex: number) => {
              if (day?.is_competition_day) {
                const totalDayIndex = (weekIndex * daysPerWeek) + dayIndex;
                if (totalDayIndex < trainingDates.length) {
                  const dateStr = trainingDates[totalDayIndex];
                  if (dateStr >= todayStr) {
                    comps.push({
                      date: dateStr,
                      userName: user?.name,
                      userId: user?.id,
                      programName: program?.name,
                      dayName: day?.name
                    });
                  }
                }
              }
            });
          });
        }
      }

      comps.sort((a, b) => a.date.localeCompare(b.date));
      setUpcomingCompetitions(comps);
    } catch (error) {
      console.error('Error fetching upcoming competitions:', error);
    } finally {
      setIsLoading(false);
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
        {isLoading ? (
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
