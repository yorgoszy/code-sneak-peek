
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { calculateDayMetrics } from "./workoutCalculations";

interface DayWeekStats {
  currentDay: {
    volume: number;
    minutes: number;
  };
  currentWeek: {
    volume: number;
    minutes: number;
  };
}

export const useDayWeekStats = (userId: string) => {
  const [stats, setStats] = useState<DayWeekStats>({
    currentDay: {
      volume: 0,
      minutes: 0
    },
    currentWeek: {
      volume: 0,
      minutes: 0
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchDayWeekStats();
    }
  }, [userId]);

  const fetchDayWeekStats = async () => {
    try {
      setLoading(true);
      
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      
      const todayString = today.toISOString().split('T')[0];
      const weekStartString = startOfWeek.toISOString().split('T')[0];

      // Fetch today's completed workouts
      const { data: todayData } = await supabase
        .from('workout_completions')
        .select('*')
        .eq('user_id', userId)
        .eq('completed_date', todayString)
        .eq('status', 'completed');

      // Fetch this week's completed workouts
      const { data: weekData } = await supabase
        .from('workout_completions')
        .select('*')
        .eq('user_id', userId)
        .gte('completed_date', weekStartString)
        .eq('status', 'completed');

      let dayVolume = 0;
      let dayMinutes = 0;
      let weekVolume = 0;
      let weekMinutes = 0;

      // Calculate today's metrics
      for (const workout of todayData || []) {
        const { data: programData } = await supabase
          .from('programs')
          .select(`
            program_weeks(
              program_days(
                program_blocks(
                  program_exercises(*)
                )
              )
            )
          `)
          .eq('id', workout.program_id)
          .single();

        if (programData?.program_weeks) {
          const week = programData.program_weeks.find((w: any) => w.week_number === workout.week_number);
          if (week?.program_days) {
            const day = week.program_days.find((d: any) => d.day_number === workout.day_number);
            if (day?.program_blocks) {
              const dayMetrics = calculateDayMetrics(day.program_blocks);
              dayVolume += dayMetrics.volume;
              dayMinutes += dayMetrics.timeMinutes;
            }
          }
        }
      }

      // Calculate this week's metrics
      for (const workout of weekData || []) {
        const { data: programData } = await supabase
          .from('programs')
          .select(`
            program_weeks(
              program_days(
                program_blocks(
                  program_exercises(*)
                )
              )
            )
          `)
          .eq('id', workout.program_id)
          .single();

        if (programData?.program_weeks) {
          const week = programData.program_weeks.find((w: any) => w.week_number === workout.week_number);
          if (week?.program_days) {
            const day = week.program_days.find((d: any) => d.day_number === workout.day_number);
            if (day?.program_blocks) {
              const dayMetrics = calculateDayMetrics(day.program_blocks);
              weekVolume += dayMetrics.volume;
              weekMinutes += dayMetrics.timeMinutes;
            }
          }
        }
      }

      setStats({
        currentDay: {
          volume: Math.round(dayVolume),
          minutes: Math.round(dayMinutes)
        },
        currentWeek: {
          volume: Math.round(weekVolume),
          minutes: Math.round(weekMinutes)
        }
      });

    } catch (error) {
      console.error('Error fetching day/week stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return { stats, loading };
};
