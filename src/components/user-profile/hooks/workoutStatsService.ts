
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

export const calculateScheduledWorkoutMetrics = async (userId: string, startDate: string, endDate: string) => {
  // Παίρνουμε τα completions για να δούμε τι έχει γίνει
  const completions = await fetchWorkoutCompletions(userId, startDate, endDate);
  
  // Παίρνουμε όλα τα assignments του χρήστη
  const { data: assignments } = await supabase
    .from('program_assignments')
    .select(`
      *,
      programs!program_assignments_program_id_fkey(
        id,
        name,
        program_weeks(
          week_number,
          program_days(
            day_number,
            estimated_duration_minutes,
            program_blocks(
              program_exercises(*)
            )
          )
        )
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'active');

  if (!assignments) return {
    scheduledWorkouts: 0,
    totalTrainingHours: 0,
    totalVolume: 0,
    missedWorkouts: 0
  };

  let scheduledWorkouts = 0;
  let totalVolume = 0;
  let totalHours = 0;
  let missedWorkouts = 0;
  const today = new Date();

  for (const assignment of assignments) {
    if (!assignment.training_dates || !assignment.programs) continue;

    for (let i = 0; i < assignment.training_dates.length; i++) {
      const date = assignment.training_dates[i];
      
      // Έλεγχος αν η ημερομηνία είναι στο επιθυμητό εύρος
      if (date >= startDate && date <= endDate) {
        scheduledWorkouts++;
        
        const program = assignment.programs as any;
        const weeks = program.program_weeks || [];
        
        if (weeks.length > 0) {
          const daysPerWeek = weeks[0].program_days?.length || 1;
          const weekIndex = Math.floor(i / daysPerWeek);
          const dayIndex = i % daysPerWeek;
          
          const week = weeks[weekIndex];
          const day = week?.program_days?.[dayIndex];
          
          if (day) {
            // Υπολογισμός όγκου και χρόνου για αυτή την προπόνηση
            if (day.program_blocks) {
              const dayMetrics = calculateDayMetrics(day.program_blocks);
              totalVolume += dayMetrics.volume;
              totalHours += dayMetrics.timeMinutes / 60;
            }
            
            // Έλεγχος αν είναι missed workout
            const workoutDate = new Date(date);
            const isPast = workoutDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const completion = completions.find(c => c.scheduled_date === date);
            
            if (isPast && (!completion || completion.status !== 'completed')) {
              missedWorkouts++;
            }
          }
        }
      }
    }
  }

  return {
    scheduledWorkouts,
    totalTrainingHours: Math.round(totalHours * 10) / 10,
    totalVolume: Math.round(totalVolume),
    missedWorkouts
  };
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
