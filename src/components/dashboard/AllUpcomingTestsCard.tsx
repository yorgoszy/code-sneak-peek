import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, differenceInCalendarDays } from "date-fns";
import { el } from "date-fns/locale";

interface UpcomingTest {
  date: string;
  type: 'scheduled' | 'program_test';
  testTypes?: string[];
  userName?: string;
  userId?: string;
}

interface AllUpcomingTestsCardProps {
  coachId?: string; // Αν δοθεί, φιλτράρει μόνο τα assignments του coach
}

export const AllUpcomingTestsCard = ({ coachId }: AllUpcomingTestsCardProps) => {
  const [upcomingTests, setUpcomingTests] = useState<UpcomingTest[]>([]);

  useEffect(() => {
    fetchAllUpcomingTests();
  }, [coachId]);

  const fetchAllUpcomingTests = async () => {
    try {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];

      const allTests: UpcomingTest[] = [];

      // Φόρτωση όλων των scheduled tests από σήμερα και μετά
      const { data: scheduledTests, error } = await supabase
        .from('tests')
        .select(`
          scheduled_date,
          user_id,
          app_users!tests_user_id_fkey(name)
        `)
        .eq('status', 'scheduled')
        .gte('scheduled_date', todayStr)
        .order('scheduled_date', { ascending: true });

      if (!error && scheduledTests) {
        scheduledTests.forEach(test => {
          allTests.push({
            date: test.scheduled_date,
            type: 'scheduled',
            userName: test.app_users?.name,
            userId: test.user_id
          });
        });
      }

      // Φόρτωση όλων των test days από program assignments
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
                is_test_day,
                test_types
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

      const { data: assignments, error: assignError } = await assignmentsQuery;

      if (!assignError && assignments) {
        for (const assignment of assignments as any[]) {
          if (assignment.training_dates && assignment.programs?.program_weeks) {
            const trainingDates = assignment.training_dates;
            const weeks = assignment.programs.program_weeks;
            const daysPerWeek = weeks[0]?.program_days?.length || 0;

            weeks.forEach((week: any, weekIndex: number) => {
              week.program_days?.forEach((day: any, dayIndex: number) => {
                if (day.is_test_day) {
                  const totalDayIndex = (weekIndex * daysPerWeek) + dayIndex;
                  if (totalDayIndex < trainingDates.length) {
                    const testDate = trainingDates[totalDayIndex];
                    if (testDate >= todayStr) {
                      allTests.push({
                        date: testDate,
                        type: 'program_test',
                        testTypes: day.test_types,
                        userName: assignment.app_users?.name,
                        userId: assignment.app_users?.id
                      });
                    }
                  }
                }
              });
            });
          }
        }
      }

      // Ταξινόμηση με ημερομηνία
      allTests.sort((a, b) => a.date.localeCompare(b.date));
      setUpcomingTests(allTests);

    } catch (error) {
      console.error('Error fetching all upcoming tests:', error);
    }
  };

  return (
    <Card className="rounded-none">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Trophy className="h-5 w-5 mr-2 text-purple-600" />
          Επερχόμενα Τεστ
        </CardTitle>
      </CardHeader>
      <CardContent>
        {upcomingTests.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Trophy className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>Δεν υπάρχουν επερχόμενα τεστ</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {upcomingTests.map((test, idx) => (
            <div 
              key={idx}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-none border border-gray-200"
            >
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="font-medium text-sm">
                    {format(new Date(test.date), 'EEEE, d MMMM', { locale: el })}
                  </p>
                  {test.userName && (
                    <p className="text-xs text-gray-600">{test.userName}</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                {test.testTypes && test.testTypes.length > 0 && (
                  <p className="text-xs font-medium text-gray-900">
                    {test.testTypes.join(', ')}
                  </p>
                )}
                <p className="text-xs text-gray-600">
                  {(() => {
                    const daysLeft = differenceInCalendarDays(new Date(test.date), new Date());
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
