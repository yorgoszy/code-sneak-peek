import { supabase } from "@/integrations/supabase/client";
import { parseRepsToTime, parseTempoToSeconds, parseRestTime } from '@/utils/timeCalculations';

interface TrainingTypeStat {
  user_id: string;
  assignment_id: string;
  workout_completion_id?: string;
  training_date: string;
  training_type: string;
  minutes: number;
}

// Εξαιρούμενοι τύποι από τα stats
const EXCLUDED_TYPES = ['mobility', 'stability', 'activation', 'neural act', 'recovery'];

/**
 * Υπολογίζει και αποθηκεύει τα training type stats για μια ολοκληρωμένη προπόνηση
 */
export const saveTrainingTypeStats = async (
  userId: string,
  assignmentId: string,
  trainingDate: string,
  dayProgram: any,
  workoutCompletionId?: string
) => {
  try {
    console.log('📊 Saving training type stats for:', { userId, assignmentId, trainingDate });
    
    if (!dayProgram?.program_blocks) {
      console.log('⚠️ No program blocks found');
      return;
    }

    const statsToInsert: TrainingTypeStat[] = [];

    // Για κάθε block, υπολογίζουμε τον χρόνο και τον τύπο
    dayProgram.program_blocks.forEach((block: any) => {
      if (!block.training_type) {
        console.log(`⚠️ Block "${block.name}" has no training_type`);
        return;
      }

      // Εξαιρούμε τους τύπους που δεν θέλουμε
      if (EXCLUDED_TYPES.includes(block.training_type)) {
        console.log(`⏭️ Skipping block "${block.name}" with type ${block.training_type}`);
        return;
      }

      // Υπολογίζουμε τον χρόνο του block
      let blockTimeSeconds = 0;
      block.program_exercises?.forEach((exercise: any) => {
        const sets = exercise.sets || 0;
        const repsData = parseRepsToTime(exercise.reps || '0');
        const isTimeMode = exercise.reps_mode === 'time' || repsData.isTime;

        if (isTimeMode) {
          const workTime = sets * repsData.seconds;
          const restSeconds = parseRestTime(exercise.rest || '');
          const totalRestTime = sets * restSeconds;
          blockTimeSeconds += workTime + totalRestTime;
        } else {
          const reps = repsData.count;
          const tempoSeconds = parseTempoToSeconds(exercise.tempo || '');
          const restSeconds = parseRestTime(exercise.rest || '');
          const workTime = sets * reps * tempoSeconds;
          const totalRestTime = sets * restSeconds;
          blockTimeSeconds += workTime + totalRestTime;
        }
      });

      const minutes = Math.round(blockTimeSeconds / 60);

      if (minutes > 0) {
        statsToInsert.push({
          user_id: userId,
          assignment_id: assignmentId,
          workout_completion_id: workoutCompletionId,
          training_date: trainingDate,
          training_type: block.training_type,
          minutes
        });
      }
    });

    console.log('📊 Stats to insert:', statsToInsert);

    if (statsToInsert.length === 0) {
      console.log('ℹ️ No training type stats to save');
      return;
    }

    // Διαγράφουμε τυχόν υπάρχοντα stats για αυτή την ημέρα/assignment
    const { error: deleteError } = await supabase
      .from('training_type_stats')
      .delete()
      .eq('user_id', userId)
      .eq('assignment_id', assignmentId)
      .eq('training_date', trainingDate);

    if (deleteError) {
      console.error('❌ Error deleting existing stats:', deleteError);
    }

    // Εισάγουμε τα νέα stats
    const { error: insertError } = await supabase
      .from('training_type_stats')
      .insert(statsToInsert);

    if (insertError) {
      console.error('❌ Error inserting training type stats:', insertError);
      throw insertError;
    }

    console.log('✅ Training type stats saved successfully');
  } catch (error) {
    console.error('❌ Error saving training type stats:', error);
    throw error;
  }
};

/**
 * Φέρνει τα training type stats για έναν χρήστη σε συγκεκριμένο χρονικό διάστημα
 */
export const fetchTrainingTypeStats = async (
  userId: string,
  startDate: string,
  endDate: string
) => {
  try {
    const { data, error } = await supabase
      .from('training_type_stats')
      .select('*')
      .eq('user_id', userId)
      .gte('training_date', startDate)
      .lte('training_date', endDate)
      .order('training_date', { ascending: true });

    if (error) {
      console.error('❌ Error fetching training type stats:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('❌ Error fetching training type stats:', error);
    return [];
  }
};

/**
 * Αθροίζει τα stats ανά training type
 */
export const aggregateStatsByType = (stats: any[]) => {
  const aggregated: Record<string, number> = {};

  stats.forEach(stat => {
    if (!aggregated[stat.training_type]) {
      aggregated[stat.training_type] = 0;
    }
    aggregated[stat.training_type] += stat.minutes;
  });

  return aggregated;
};

/**
 * Αθροίζει τα stats ανά εβδομάδα και training type
 */
export const aggregateStatsByWeek = (stats: any[]) => {
  const weeklyStats: Record<string, Record<string, number>> = {};

  stats.forEach(stat => {
    const date = new Date(stat.training_date);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay() + 1); // Δευτέρα
    const weekKey = weekStart.toISOString().split('T')[0];

    if (!weeklyStats[weekKey]) {
      weeklyStats[weekKey] = {};
    }
    if (!weeklyStats[weekKey][stat.training_type]) {
      weeklyStats[weekKey][stat.training_type] = 0;
    }
    weeklyStats[weekKey][stat.training_type] += stat.minutes;
  });

  return weeklyStats;
};

/**
 * Αθροίζει τα stats ανά μήνα και training type
 */
export const aggregateStatsByMonth = (stats: any[]) => {
  const monthlyStats: Record<string, Record<string, number>> = {};

  stats.forEach(stat => {
    const date = new Date(stat.training_date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!monthlyStats[monthKey]) {
      monthlyStats[monthKey] = {};
    }
    if (!monthlyStats[monthKey][stat.training_type]) {
      monthlyStats[monthKey][stat.training_type] = 0;
    }
    monthlyStats[monthKey][stat.training_type] += stat.minutes;
  });

  return monthlyStats;
};

/**
 * Υπολογίζει stats από τα ολοκληρωμένα workouts (για retroactive calculation)
 */
export const calculateStatsFromCompletedWorkouts = async (userId: string) => {
  try {
    console.log('📊 Calculating stats from completed workouts for user:', userId);
    
    // Βρίσκουμε όλα τα completed workouts του χρήστη
    const { data: completedWorkouts, error: workoutsError } = await supabase
      .from('workout_completions')
      .select(`
        id,
        assignment_id,
        scheduled_date,
        program_assignments!inner(
          id,
          program_id,
          training_dates,
          programs!inner(
            id,
            program_weeks(
              id,
              week_number,
              program_days(
                id,
                day_number,
                program_blocks(
                  id,
                  training_type,
                  program_exercises(
                    id,
                    sets,
                    reps,
                    tempo,
                    rest,
                    reps_mode
                  )
                )
              )
            )
          )
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'completed');

    if (workoutsError) {
      console.error('❌ Error fetching completed workouts:', workoutsError);
      return [];
    }

    if (!completedWorkouts || completedWorkouts.length === 0) {
      console.log('ℹ️ No completed workouts found');
      return [];
    }

    console.log(`📊 Found ${completedWorkouts.length} completed workouts`);

    // Ελέγχουμε ποια έχουν ήδη stats
    const { data: existingStats } = await supabase
      .from('training_type_stats')
      .select('workout_completion_id')
      .eq('user_id', userId);

    const existingCompletionIds = new Set((existingStats || []).map(s => s.workout_completion_id));

    const allStats: TrainingTypeStat[] = [];

    for (const workout of completedWorkouts) {
      if (existingCompletionIds.has(workout.id)) {
        console.log(`⏭️ Skipping workout ${workout.id} - already has stats`);
        continue;
      }

      const assignment = workout.program_assignments as any;
      const program = assignment?.programs;
      const trainingDates = assignment?.training_dates || [];
      
      if (!program?.program_weeks) continue;

      // Βρίσκουμε σε ποια ημέρα αντιστοιχεί αυτή η προπόνηση
      const dateIndex = trainingDates.findIndex((d: string) => d === workout.scheduled_date);
      if (dateIndex === -1) {
        console.log(`⚠️ Could not find date index for ${workout.scheduled_date}`);
        continue;
      }

      // Υπολογίζουμε week και day index
      const daysPerWeek = program.program_weeks[0]?.program_days?.length || 1;
      const weekIndex = Math.floor(dateIndex / daysPerWeek);
      const dayIndex = dateIndex % daysPerWeek;

      const week = program.program_weeks[weekIndex];
      if (!week) {
        console.log(`⚠️ Could not find week ${weekIndex}`);
        continue;
      }

      const day = week.program_days?.[dayIndex];
      if (!day) {
        console.log(`⚠️ Could not find day ${dayIndex} in week ${weekIndex}`);
        continue;
      }

      console.log(`📊 Processing workout ${workout.id}: Week ${weekIndex + 1}, Day ${dayIndex + 1}, Date: ${workout.scheduled_date}`);

      // Μόνο για τα blocks αυτής της ημέρας
      day.program_blocks?.forEach((block: any) => {
        if (!block.training_type) return;
        if (EXCLUDED_TYPES.includes(block.training_type)) return;

        let blockTimeSeconds = 0;
        block.program_exercises?.forEach((exercise: any) => {
          const sets = exercise.sets || 0;
          const repsData = parseRepsToTime(exercise.reps || '0');
          const isTimeMode = exercise.reps_mode === 'time' || repsData.isTime;

          if (isTimeMode) {
            const workTime = sets * repsData.seconds;
            const restSeconds = parseRestTime(exercise.rest || '');
            const totalRestTime = sets * restSeconds;
            blockTimeSeconds += workTime + totalRestTime;
          } else {
            const reps = repsData.count;
            const tempoSeconds = parseTempoToSeconds(exercise.tempo || '');
            const restSeconds = parseRestTime(exercise.rest || '');
            const workTime = sets * reps * tempoSeconds;
            const totalRestTime = sets * restSeconds;
            blockTimeSeconds += workTime + totalRestTime;
          }
        });

        const minutes = Math.round(blockTimeSeconds / 60);

        if (minutes > 0) {
          allStats.push({
            user_id: userId,
            assignment_id: workout.assignment_id,
            workout_completion_id: workout.id,
            training_date: workout.scheduled_date,
            training_type: block.training_type,
            minutes
          });
        }
      });
    }

    console.log(`📊 Calculated ${allStats.length} stats entries`);

    if (allStats.length > 0) {
      const { error: insertError } = await supabase
        .from('training_type_stats')
        .insert(allStats);

      if (insertError) {
        console.error('❌ Error inserting retroactive stats:', insertError);
      } else {
        console.log('✅ Retroactive stats saved successfully');
      }
    }

    return allStats;
  } catch (error) {
    console.error('❌ Error calculating retroactive stats:', error);
    return [];
  }
};
