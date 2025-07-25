import { supabase } from "@/integrations/supabase/client";

export const programCompletionService = {
  async checkAndCompleteProgramAssignments() {
    console.log('🔄 Checking for auto-completion of program assignments...');
    
    try {
      // Βρες όλες τις ενεργές αναθέσεις
      const { data: assignments, error: assignmentsError } = await supabase
        .from('program_assignments')
        .select('id, training_dates')
        .eq('status', 'active');

      if (assignmentsError) {
        console.error('❌ Error fetching assignments:', assignmentsError);
        return;
      }

      if (!assignments || assignments.length === 0) {
        console.log('ℹ️ No active assignments found');
        return;
      }

      console.log(`📊 Found ${assignments.length} active assignments to check`);

      // Για κάθε ανάθεση, ελέγξε αν όλες οι προπονήσεις έχουν ολοκληρωθεί
      let completedCount = 0;

      for (const assignment of assignments) {
        if (!assignment.training_dates || !Array.isArray(assignment.training_dates)) {
          continue;
        }

        // Βρες όλες τις workout completions για αυτή την ανάθεση
        const { data: completions, error: completionsError } = await supabase
          .from('workout_completions')
          .select('scheduled_date, status')
          .eq('assignment_id', assignment.id);

        if (completionsError) {
          console.error(`❌ Error fetching completions for assignment ${assignment.id}:`, completionsError);
          continue;
        }

        // Ελέγξε αν όλες οι προπονήσεις έχουν completion (completed ή missed)
        const totalWorkouts = assignment.training_dates.length;
        const completedWorkouts = completions?.filter(c => c.status === 'completed').length || 0;
        const missedWorkouts = completions?.filter(c => c.status === 'missed').length || 0;
        const processedWorkouts = completedWorkouts + missedWorkouts;

        console.log(`📊 Assignment ${assignment.id}: ${processedWorkouts}/${totalWorkouts} workouts processed (${completedWorkouts} completed, ${missedWorkouts} missed)`);

        // Αν όλες οι προπονήσεις έχουν ολοκληρωθεί (ή χαθεί), σημείωσε την ανάθεση ως ολοκληρωμένη
        if (processedWorkouts === totalWorkouts) {
          const { error: updateError } = await supabase
            .from('program_assignments')
            .update({
              status: 'completed',
              end_date: new Date().toISOString().split('T')[0],
              updated_at: new Date().toISOString()
            })
            .eq('id', assignment.id);

          if (updateError) {
            console.error(`❌ Error completing assignment ${assignment.id}:`, updateError);
          } else {
            completedCount++;
            console.log(`✅ Assignment ${assignment.id} marked as completed`);
          }
        }
      }

      console.log(`✅ Auto-completed ${completedCount} program assignments`);
      return { completed: completedCount };

    } catch (error) {
      console.error('❌ Unexpected error in checkAndCompleteProgramAssignments:', error);
      throw error;
    }
  }
};