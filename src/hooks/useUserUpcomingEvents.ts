import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, differenceInCalendarDays } from 'date-fns';
import { el } from 'date-fns/locale';

interface UpcomingCompetition {
  date: string;
  programName?: string;
  dayName?: string;
  daysUntil: number;
}

interface UpcomingTest {
  date: string;
  type: 'scheduled' | 'program_test';
  testTypes?: string[];
  daysUntil: number;
}

export const useUserUpcomingEvents = (userId?: string) => {
  const [competitions, setCompetitions] = useState<UpcomingCompetition[]>([]);
  const [tests, setTests] = useState<UpcomingTest[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchUserEvents();
    } else {
      setCompetitions([]);
      setTests([]);
    }
  }, [userId]);

  const fetchUserEvents = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const todayStr = format(new Date(), 'yyyy-MM-dd');

      // Fetch competitions από program assignments
      const { data: assignments } = await supabase
        .from('program_assignments')
        .select(`
          id,
          training_dates,
          programs:program_id (
            id,
            name,
            program_weeks (
              id,
              week_number,
              program_days (
                id,
                name,
                day_number,
                is_competition_day,
                is_test_day,
                test_types
              )
            )
          )
        `)
        .eq('user_id', userId)
        .in('status', ['active', 'completed'])
        .not('training_dates', 'is', null);

      const upcomingComps: UpcomingCompetition[] = [];
      const upcomingTests: UpcomingTest[] = [];

      if (assignments) {
        for (const assignment of assignments) {
          const trainingDates = assignment.training_dates || [];
          const program = assignment.programs as any;
          const weeks = program?.program_weeks || [];
          
          if (!weeks.length) continue;
          
          const daysPerWeek = weeks[0]?.program_days?.length || 0;
          if (!daysPerWeek) continue;

          weeks.forEach((week: any, weekIndex: number) => {
            (week.program_days || []).forEach((day: any, dayIndex: number) => {
              const totalDayIndex = (weekIndex * daysPerWeek) + dayIndex;
              if (totalDayIndex >= trainingDates.length) return;
              
              const dateStr = trainingDates[totalDayIndex];
              if (dateStr < todayStr) return;

              const daysUntil = differenceInCalendarDays(new Date(dateStr), new Date());

              // Competition day
              if (day.is_competition_day) {
                upcomingComps.push({
                  date: dateStr,
                  programName: program?.name,
                  dayName: day?.name,
                  daysUntil
                });
              }

              // Test day
              if (day.is_test_day) {
                upcomingTests.push({
                  date: dateStr,
                  type: 'program_test',
                  testTypes: day.test_types,
                  daysUntil
                });
              }
            });
          });
        }
      }

      // Fetch scheduled tests
      const { data: scheduledTests } = await supabase
        .from('tests')
        .select('scheduled_date, test_type')
        .eq('user_id', userId)
        .eq('status', 'scheduled')
        .gte('scheduled_date', todayStr)
        .order('scheduled_date', { ascending: true });

      if (scheduledTests) {
        scheduledTests.forEach(test => {
          const daysUntil = differenceInCalendarDays(new Date(test.scheduled_date), new Date());
          upcomingTests.push({
            date: test.scheduled_date,
            type: 'scheduled',
            testTypes: test.test_type ? [test.test_type] : undefined,
            daysUntil
          });
        });
      }

      // Sort by date
      upcomingComps.sort((a, b) => a.date.localeCompare(b.date));
      upcomingTests.sort((a, b) => a.date.localeCompare(b.date));

      setCompetitions(upcomingComps);
      setTests(upcomingTests);

    } catch (error) {
      console.error('Error fetching user events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return { competitions, tests, isLoading };
};
