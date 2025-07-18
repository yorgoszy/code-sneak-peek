
import { supabase } from "@/integrations/supabase/client";
import { calculateDayMetrics } from "./workoutCalculations";

export const fetchWorkoutCompletions = async (userId: string, startDate: string, endDate: string) => {
  const { data } = await supabase
    .from('workout_completions')
    .select('*')
    .eq('user_id', userId)
    .gte('scheduled_date', startDate)
    .lte('scheduled_date', endDate);

  return data || [];
};

export const calculateWorkoutMetrics = async (completions: any[]) => {
  let totalVolume = 0;
  let totalHours = 0;
  const completedWorkouts = completions.filter(w => w.status === 'completed');
  const missedWorkouts = completions.filter(w => w.status === 'missed').length;

  for (const workout of completedWorkouts) {
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
          totalVolume += dayMetrics.volume;
          totalHours += dayMetrics.timeMinutes / 60;
        }
      }
    }
  }

  return {
    completedWorkouts: completedWorkouts.length,
    totalTrainingHours: Math.round(totalHours * 10) / 10,
    totalVolume: Math.round(totalVolume),
    missedWorkouts
  };
};

export const getDateRanges = () => {
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  return {
    currentMonth: {
      start: currentMonthStart.toISOString().split('T')[0],
      end: currentMonthEnd.toISOString().split('T')[0]
    },
    previousMonth: {
      start: previousMonthStart.toISOString().split('T')[0],
      end: previousMonthEnd.toISOString().split('T')[0]
    }
  };
};
