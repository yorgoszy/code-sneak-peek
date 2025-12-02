import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, differenceInCalendarDays } from 'date-fns';
import { el } from 'date-fns/locale';

interface Competition {
  date: string;
  programName?: string;
  dayName?: string;
  daysUntil: number;
  isPast: boolean;
}

interface Test {
  date: string;
  type: 'scheduled' | 'program_test';
  testTypes?: string[];
  daysUntil: number;
  isPast: boolean;
}

export const useUserUpcomingEvents = (userId?: string) => {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
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

      const allComps: Competition[] = [];
      const allTests: Test[] = [];

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
              const daysUntil = differenceInCalendarDays(new Date(dateStr), new Date());
              const isPast = dateStr < todayStr;

              // Competition day - φέρνε και παρελθόντες και μελλοντικούς
              if (day.is_competition_day) {
                allComps.push({
                  date: dateStr,
                  programName: program?.name,
                  dayName: day?.name,
                  daysUntil,
                  isPast
                });
              }

              // Test day
              if (day.is_test_day) {
                allTests.push({
                  date: dateStr,
                  type: 'program_test',
                  testTypes: day.test_types,
                  daysUntil,
                  isPast
                });
              }
            });
          });
        }
      }

      // Fetch scheduled tests (παρελθόντα και μελλοντικά)
      const { data: scheduledTests } = await supabase
        .from('tests')
        .select('scheduled_date, test_type, status')
        .eq('user_id', userId)
        .in('status', ['scheduled', 'completed'])
        .order('scheduled_date', { ascending: false })
        .limit(20);

      if (scheduledTests) {
        scheduledTests.forEach(test => {
          const daysUntil = differenceInCalendarDays(new Date(test.scheduled_date), new Date());
          const isPast = test.scheduled_date < todayStr;
          allTests.push({
            date: test.scheduled_date,
            type: 'scheduled',
            testTypes: test.test_type ? [test.test_type] : undefined,
            daysUntil,
            isPast
          });
        });
      }

      // Sort by date (newest first for past, oldest first for future)
      allComps.sort((a, b) => b.date.localeCompare(a.date));
      allTests.sort((a, b) => b.date.localeCompare(a.date));

      setCompetitions(allComps);
      setTests(allTests);

    } catch (error) {
      console.error('Error fetching user events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return { competitions, tests, isLoading };
};
