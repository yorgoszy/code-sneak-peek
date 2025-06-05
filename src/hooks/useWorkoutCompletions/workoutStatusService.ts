
import { supabase } from "@/integrations/supabase/client";

export const workoutStatusService = {
  async markWorkoutCompleted(
    assignmentId: string, 
    scheduledDate: string,
    actualCompletionDate?: string
  ) {
    const completedDate = actualCompletionDate || new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('workout_completions')
      .update({ 
        status: 'completed',
        status_color: 'green',
        completed_date: completedDate
      })
      .eq('assignment_id', assignmentId)
      .eq('scheduled_date', scheduledDate)
      .select()
      .single();

    if (error) {
      console.error('❌ Error marking workout as completed:', error);
      throw error;
    }

    console.log('✅ Workout marked as completed:', data);
    return data;
  },

  async markWorkoutMissed(assignmentId: string, scheduledDate: string) {
    const { data, error } = await supabase
      .from('workout_completions')
      .update({ 
        status: 'missed',
        status_color: 'red',
        completed_date: null // Missed workouts don't have completion date
      })
      .eq('assignment_id', assignmentId)
      .eq('scheduled_date', scheduledDate)
      .select()
      .single();

    if (error) {
      console.error('❌ Error marking workout as missed:', error);
      throw error;
    }

    console.log('✅ Workout marked as missed:', data);
    return data;
  },

  async markMissedWorkoutsForPastDates() {
    const today = new Date().toISOString().split('T')[0];
    
    console.log('🔄 Checking for missed workouts before:', today);
    
    const { data, error } = await supabase
      .from('workout_completions')
      .update({ 
        status: 'missed',
        status_color: 'red'
      })
      .lt('scheduled_date', today)
      .eq('status', 'pending')
      .select();

    if (error) {
      console.error('❌ Error marking past workouts as missed:', error);
      throw error;
    }

    if (data && data.length > 0) {
      console.log(`✅ Marked ${data.length} past workouts as missed:`, data);
    } else {
      console.log('ℹ️ No past pending workouts found to mark as missed');
    }

    return data || [];
  }
};
