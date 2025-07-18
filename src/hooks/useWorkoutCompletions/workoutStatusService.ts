
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
    
    try {
      // 1. Βρες όλες τις ενεργές αναθέσεις
      const { data: assignments, error: assignmentsError } = await supabase
        .from('program_assignments')
        .select('id, user_id, program_id, training_dates')
        .eq('status', 'active');

      if (assignmentsError) {
        console.error('❌ Error fetching assignments:', assignmentsError);
        throw assignmentsError;
      }

      if (!assignments || assignments.length === 0) {
        console.log('ℹ️ No active assignments found');
        return [];
      }

      console.log(`📊 Found ${assignments.length} active assignments`);

      // 2. Για κάθε ανάθεση, ελέγξε για χαμένες προπονήσεις
      const missedWorkouts = [];
      
      for (const assignment of assignments) {
        if (!assignment.training_dates || !Array.isArray(assignment.training_dates)) {
          continue;
        }

        // Βρες προπονήσεις στο παρελθόν που δεν έχουν completion
        const pastDates = assignment.training_dates.filter(date => date < today);
        
        for (const date of pastDates) {
          // Ελέγξε αν υπάρχει ήδη completion για αυτή την ημερομηνία
          const { data: existingCompletion } = await supabase
            .from('workout_completions')
            .select('id, status')
            .eq('assignment_id', assignment.id)
            .eq('scheduled_date', date)
            .maybeSingle();

          // Αν δεν υπάρχει completion ή υπάρχει αλλά δεν είναι completed/missed
          if (!existingCompletion || (existingCompletion.status !== 'completed' && existingCompletion.status !== 'missed')) {
            // Υπολόγισε week_number και day_number από τη θέση στο array
            const dateIndex = assignment.training_dates.indexOf(date);
            
            // Θεωρούμε ότι κάθε εβδομάδα έχει 7 ημέρες (ή λιγότερες)
            // Αλλά επειδή δεν γνωρίζουμε την ακριβή δομή, θέτουμε απλές τιμές
            const weekNumber = Math.floor(dateIndex / 7) + 1;
            const dayNumber = (dateIndex % 7) + 1;

            if (existingCompletion) {
              // Ενημέρωση του υπάρχοντος record
              const { error: updateError } = await supabase
                .from('workout_completions')
                .update({
                  status: 'missed',
                  status_color: 'red',
                  updated_at: new Date().toISOString()
                })
                .eq('id', existingCompletion.id);

              if (updateError) {
                console.error('❌ Error updating workout to missed:', updateError);
              } else {
                console.log(`✅ Updated workout ${existingCompletion.id} to missed`);
              }
            } else {
              // Νέο record
              missedWorkouts.push({
                assignment_id: assignment.id,
                user_id: assignment.user_id,
                program_id: assignment.program_id,
                scheduled_date: date,
                week_number: weekNumber,
                day_number: dayNumber,
                status: 'missed',
                status_color: 'red',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });
            }
          }
        }
      }

      if (missedWorkouts.length === 0) {
        console.log('ℹ️ No new missed workouts found to create');
        return [];
      }

      console.log(`🔄 Creating ${missedWorkouts.length} missed workout records`);

      // 3. Εισαγωγή των χαμένων προπονήσεων (μόνο τις νέες)
      const { data, error } = await supabase
        .from('workout_completions')
        .insert(missedWorkouts)
        .select();

      if (error) {
        console.error('❌ Error creating missed workout records:', error);
        throw error;
      }

      console.log(`✅ Created ${data?.length || 0} missed workout records`);
      return data || [];

    } catch (error) {
      console.error('❌ Unexpected error in markMissedWorkoutsForPastDates:', error);
      throw error;
    }
  }
};
