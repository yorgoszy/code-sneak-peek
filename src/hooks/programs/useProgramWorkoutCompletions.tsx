
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useProgramWorkoutCompletions = () => {
  const createWorkoutCompletions = async (
    assignmentId: string,
    userId: string,
    programId: string,
    trainingDates: string[],
    programStructure: any
  ) => {
    console.log('📅 Creating workout completions for:', {
      assignmentId,
      userId,
      programId,
      trainingDates: trainingDates.length,
      programStructure
    });

    try {
      const completions = [];
      let dateIndex = 0;
      
      // Για κάθε εβδομάδα και ημέρα του προγράμματος
      for (let weekNumber = 1; weekNumber <= (programStructure.weeks?.length || 0); weekNumber++) {
        const week = programStructure.weeks?.[weekNumber - 1];
        if (!week?.days) continue;

        for (let dayNumber = 1; dayNumber <= week.days.length; dayNumber++) {
          if (dateIndex < trainingDates.length) {
            const scheduledDate = trainingDates[dateIndex];
            
            completions.push({
              assignment_id: assignmentId,
              user_id: userId,
              program_id: programId,
              week_number: weekNumber,
              day_number: dayNumber,
              scheduled_date: scheduledDate,
              completed_date: null, // Null για μη ολοκληρωμένες προπονήσεις
              status: 'pending', // Χρησιμοποιούμε 'pending' αντί για 'scheduled'
              status_color: 'blue',
              notes: null,
              start_time: null,
              end_time: null,
              actual_duration_minutes: null
            });
            
            dateIndex++;
          }
        }
      }

      console.log('💾 Inserting workout completions as pending:', completions);

      if (completions.length > 0) {
        const { data, error } = await supabase
          .from('workout_completions')
          .insert(completions)
          .select();

        if (error) {
          console.error('❌ Error creating workout completions:', error);
          throw error;
        }

        console.log('✅ Workout completions created successfully as pending:', data);
        return data;
      }

      return [];
    } catch (error) {
      console.error('❌ Error in createWorkoutCompletions:', error);
      throw error;
    }
  };

  return {
    createWorkoutCompletions
  };
};
