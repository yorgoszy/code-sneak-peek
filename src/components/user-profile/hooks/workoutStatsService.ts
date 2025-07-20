
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
  console.log('🔍 calculateScheduledWorkoutMetrics:', { userId, startDate, endDate });
  // Παίρνουμε τα completions για να δούμε τι έχει γίνει
  const completions = await fetchWorkoutCompletions(userId, startDate, endDate);
  console.log('🔍 Completions found:', completions?.length || 0);
  
  // Παίρνουμε όλα τα assignments του χρήστη - ΑΠΛΟ QUERY
  const { data: assignments } = await supabase
    .from('program_assignments')
    .select('id, program_id, training_dates')
    .eq('user_id', userId)
    .eq('status', 'active');

  if (!assignments) {
    console.log('❌ No assignments found for user:', userId);
    return {
      scheduledWorkouts: 0,
      totalTrainingHours: 0,
      totalVolume: 0,
      missedWorkouts: 0
    };
  }
  
  console.log('✅ Assignments found:', assignments.length);

  let scheduledWorkouts = 0;
  let totalVolume = 0;
  let totalHours = 0;
  let missedWorkouts = 0;

  // Χρησιμοποίησε την ίδια λογική με το ημερολόγιο
  for (const assignment of assignments) {
    console.log('🔍 Processing assignment:', assignment.id, 'Training dates:', assignment.training_dates?.length || 0);
    if (!assignment.training_dates) continue;

    // Φιλτράρισμα ημερομηνιών για το επιθυμητό εύρος
    const periodDates = assignment.training_dates.filter(date => 
      date && date >= startDate && date <= endDate
    );

    for (const date of periodDates) {
      scheduledWorkouts++;
      
      const completion = completions.find(c => 
        c.assignment_id === assignment.id && c.scheduled_date === date
      );
      
      if (completion?.status === 'completed') {
        // Completed workout - δεν κάνουμε τίποτα ειδικό εδώ για τώρα
      } else {
        // Έλεγχος αν έχει περάσει η ημερομηνία - ΙΔΙΑ ΛΟΓΙΚΗ ΜΕ ΗΜΕΡΟΛΟΓΙΟ
        const workoutDate = new Date(date);
        const today = new Date();
        const isPast = workoutDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());
        
        if (isPast || completion?.status === 'missed') {
          missedWorkouts++;
          console.log('❌ Missed workout found:', date, 'completion:', completion?.status);
        }
      }
    }
  }

  console.log('📊 Final stats:', {
    scheduledWorkouts,
    totalTrainingHours: 0, // Simplified για τώρα
    totalVolume: 0, // Simplified για τώρα  
    missedWorkouts
  });

  return {
    scheduledWorkouts,
    totalTrainingHours: 0, // Simplified για τώρα
    totalVolume: 0, // Simplified για τώρα
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
