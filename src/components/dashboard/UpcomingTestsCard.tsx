import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useActivePrograms } from "@/hooks/useActivePrograms";
import { format } from "date-fns";
import { el } from "date-fns/locale";

interface UpcomingTest {
  date: string;
  type: 'scheduled' | 'program_test';
  testTypes?: string[];
  userName?: string;
  userId?: string;
}

export const UpcomingTestsCard = () => {
  const [upcomingTests, setUpcomingTests] = useState<UpcomingTest[]>([]);
  const { data: activePrograms } = useActivePrograms();

  useEffect(() => {
    fetchUpcomingTests();
  }, [activePrograms]);

  const fetchUpcomingTests = async () => {
    try {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const nextWeekStr = nextWeek.toISOString().split('T')[0];

      const allTests: UpcomingTest[] = [];

      // Φόρτωση scheduled tests από την εβδομάδα
      const { data: scheduledTests, error } = await supabase
        .from('tests')
        .select(`
          scheduled_date,
          user_id,
          app_users!tests_user_id_fkey(name)
        `)
        .eq('status', 'scheduled')
        .gte('scheduled_date', todayStr)
        .lte('scheduled_date', nextWeekStr)
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

      // Φόρτωση test days από active programs της εβδομάδας
      if (activePrograms && activePrograms.length > 0) {
        for (const assignment of activePrograms) {
          if (assignment.training_dates && assignment.programs?.program_weeks) {
            const trainingDates = assignment.training_dates;
            const weeks = assignment.programs.program_weeks;
            const daysPerWeek = weeks[0]?.program_days?.length || 0;

            weeks.forEach((week, weekIndex) => {
              week.program_days?.forEach((day, dayIndex) => {
                if (day.is_test_day) {
                  const totalDayIndex = (weekIndex * daysPerWeek) + dayIndex;
                  if (totalDayIndex < trainingDates.length) {
                    const testDate = trainingDates[totalDayIndex];
                    if (testDate >= todayStr && testDate <= nextWeekStr) {
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
      console.error('Error fetching upcoming tests:', error);
    }
  };

  if (upcomingTests.length === 0) {
    return null;
  }

  return (
    <Card className="rounded-none">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Trophy className="h-5 w-5 mr-2 text-purple-600" />
          Επερχόμενα Τεστ Εβδομάδας
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
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
                  <p className="text-xs text-gray-600">
                    {test.testTypes.join(', ')}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
