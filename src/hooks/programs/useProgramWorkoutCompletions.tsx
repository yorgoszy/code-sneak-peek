
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
    console.log('📅 [useProgramWorkoutCompletions] Creating workout completions for:', {
      assignmentId,
      userId,
      programId,
      trainingDates: trainingDates.length,
      programStructure
    });

    // 🔍 ΕΚΤΕΝΗΣ ΑΝΑΛΥΣΗ ΔΟΜΗΣ ΠΡΟΓΡΑΜΜΑΤΟΣ
    console.log('🔍 [useProgramWorkoutCompletions] Detailed program structure:');
    if (programStructure.weeks) {
      programStructure.weeks.forEach((week, wIndex) => {
        console.log(`🔍  Week ${wIndex + 1}: ${week.name || `Week ${week.week_number}`}`);
        if (week.days) {
          week.days.forEach((day, dIndex) => {
            console.log(`🔍    Day ${dIndex + 1}: ${day.name || `Day ${day.day_number}`}`);
            if (day.blocks && day.blocks.length > 0) {
              day.blocks.forEach((block, bIndex) => {
                console.log(`🔍      Block ${bIndex + 1}: ${block.name}`);
                if (block.exercises && block.exercises.length > 0) {
                  block.exercises.forEach((ex, eIndex) => {
                    console.log(`🔍        Exercise ${eIndex + 1}: ${ex.name} (order: ${ex.exercise_order || 'no order'})`);
                  });
                }
              });
            }
          });
        }
      });
    }

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

      console.log('💾 [useProgramWorkoutCompletions] Inserting workout completions as pending:', completions);

      if (completions.length > 0) {
        const { data, error } = await supabase
          .from('workout_completions')
          .insert(completions)
          .select();

        if (error) {
          console.error('❌ [useProgramWorkoutCompletions] Error creating workout completions:', error);
          throw error;
        }

        console.log('✅ [useProgramWorkoutCompletions] Workout completions created successfully as pending:', data);
        return data;
      }

      return [];
    } catch (error) {
      console.error('❌ [useProgramWorkoutCompletions] Error in createWorkoutCompletions:', error);
      throw error;
    }
  };

  return {
    createWorkoutCompletions
  };
};
