import { supabase } from "@/integrations/supabase/client";

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
    console.log('🔴 LiveSync: markInProgress called', { assignmentId, scheduledDate, userId });
    try {
      // Check if record exists
      const { data: existing, error: fetchError } = await supabase
        .from('workout_completions')
        .select('id, status')
        .eq('assignment_id', assignmentId)
        .eq('scheduled_date', scheduledDate)
        .maybeSingle();

      if (fetchError) {
        console.error('❌ LiveSync: Error fetching existing record:', fetchError);
        return;
      }

      if (existing) {
        if (existing.status === 'completed') {
          console.log('⚠️ LiveSync: Workout already completed, skipping');
          return;
        }
        const { error: updateError } = await supabase
          .from('workout_completions')
          .update({
            status: 'in_progress',
            start_time: new Date().toISOString(),
            checked_exercises: [],
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
        
        if (updateError) {
          console.error('❌ LiveSync: Error updating to in_progress:', updateError);
          return;
        }
      } else {
        // Get program_id from assignment - simple query, no complex calculation needed
        const { data: assignmentData, error: assignmentError } = await supabase
          .from('program_assignments')
          .select('program_id, training_dates')
          .eq('id', assignmentId)
          .single();

        if (assignmentError || !assignmentData) {
          console.error('❌ LiveSync: Error fetching assignment:', assignmentError);
          return;
        }

        // Simple week/day calculation from training_dates position
        const trainingDates = assignmentData.training_dates || [];
        const dateIndex = trainingDates.findIndex((d: string) => d === scheduledDate);
        const weekNumber = dateIndex >= 0 ? Math.floor(dateIndex / 7) + 1 : 1;
        const dayNumber = dateIndex >= 0 ? (dateIndex % 7) + 1 : 1;
        
        const { error: insertError } = await supabase
          .from('workout_completions')
          .insert({
            assignment_id: assignmentId,
            user_id: userId,
            program_id: assignmentData.program_id,
            week_number: weekNumber,
            day_number: dayNumber,
            scheduled_date: scheduledDate,
            status: 'in_progress',
            start_time: new Date().toISOString(),
            checked_exercises: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (insertError) {
          console.error('❌ LiveSync: Error inserting in_progress record:', insertError);
          return;
        }
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
