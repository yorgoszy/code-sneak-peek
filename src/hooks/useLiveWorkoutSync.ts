import { supabase } from "@/integrations/supabase/client";
import { calculateWeekAndDay } from "./useWorkoutCompletions/weekDayCalculator";

/**
 * Service to sync workout state to DB for live cross-device visibility.
 */
export const liveWorkoutSync = {
  /**
   * Mark a workout as in_progress in the DB so admin can see it live.
   */
  async markInProgress(
    assignmentId: string,
    scheduledDate: string,
    userId: string
  ) {
    try {
      // Check if record exists
      const { data: existing } = await supabase
        .from('workout_completions')
        .select('id, status')
        .eq('assignment_id', assignmentId)
        .eq('scheduled_date', scheduledDate)
        .maybeSingle();

      if (existing) {
        if (existing.status === 'completed') {
          console.log('⚠️ LiveSync: Workout already completed, skipping');
          return;
        }
        await supabase
          .from('workout_completions')
          .update({
            status: 'in_progress',
            start_time: new Date().toISOString(),
            checked_exercises: [],
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
      } else {
        const { weekNumber, dayNumber, programId } = await calculateWeekAndDay(assignmentId, scheduledDate);
        
        await supabase
          .from('workout_completions')
          .insert({
            assignment_id: assignmentId,
            user_id: userId,
            program_id: programId,
            week_number: weekNumber,
            day_number: dayNumber,
            scheduled_date: scheduledDate,
            status: 'in_progress',
            start_time: new Date().toISOString(),
            checked_exercises: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      }
      console.log('✅ LiveSync: Workout marked as in_progress');
    } catch (error) {
      console.error('❌ LiveSync markInProgress error:', error);
    }
  },

  /**
   * Update checked exercises in DB for live visibility.
   */
  async updateCheckedExercises(
    assignmentId: string,
    scheduledDate: string,
    checkedExerciseIds: string[]
  ) {
    try {
      await supabase
        .from('workout_completions')
        .update({
          checked_exercises: checkedExerciseIds,
          updated_at: new Date().toISOString()
        })
        .eq('assignment_id', assignmentId)
        .eq('scheduled_date', scheduledDate);
    } catch (error) {
      console.error('❌ LiveSync updateCheckedExercises error:', error);
    }
  },

  /**
   * Clear in_progress status (on cancel).
   */
  async clearInProgress(assignmentId: string, scheduledDate: string) {
    try {
      const { data: existing } = await supabase
        .from('workout_completions')
        .select('id, status')
        .eq('assignment_id', assignmentId)
        .eq('scheduled_date', scheduledDate)
        .maybeSingle();

      if (existing && existing.status === 'in_progress') {
        await supabase
          .from('workout_completions')
          .delete()
          .eq('id', existing.id);
        console.log('✅ LiveSync: In-progress record cleared');
      }
    } catch (error) {
      console.error('❌ LiveSync clearInProgress error:', error);
    }
  },

  /**
   * Fetch live workout data (in_progress workouts) for admin/coach view.
   */
  async getLiveWorkouts(assignmentIds: string[]) {
    if (assignmentIds.length === 0) return [];
    
    try {
      const { data, error } = await supabase
        .from('workout_completions')
        .select('assignment_id, scheduled_date, status, start_time, checked_exercises')
        .in('assignment_id', assignmentIds)
        .eq('status', 'in_progress');

      if (error) {
        console.error('❌ LiveSync getLiveWorkouts error:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('❌ LiveSync getLiveWorkouts error:', error);
      return [];
    }
  }
};
