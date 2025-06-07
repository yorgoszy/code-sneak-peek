
import { supabase } from "@/integrations/supabase/client";
import type { ProgramStructure } from '../hooks/useProgramBuilderState';

export const workoutCompletionService = {
  async createWorkoutCompletions(
    assignment: any,
    savedProgram: any,
    userId: string,
    trainingDatesStrings: string[],
    program: ProgramStructure
  ) {
    const totalDaysInProgram = program.weeks?.reduce((total, week) => total + (week.days?.length || 0), 0) || 1;
    
    const workoutCompletions = trainingDatesStrings.map((date, index) => {
      const weekNumber = Math.floor(index / (totalDaysInProgram / (program.weeks?.length || 1))) + 1;
      const dayNumber = (index % (totalDaysInProgram / (program.weeks?.length || 1))) + 1;

      return {
        assignment_id: assignment.id,
        user_id: userId,
        program_id: savedProgram.id,
        week_number: weekNumber,
        day_number: dayNumber,
        scheduled_date: date,
        completed_date: null, // Null για μη ολοκληρωμένες προπονήσεις
        status: 'pending', // Χρησιμοποιούμε 'pending' αντί για 'scheduled'
        status_color: 'blue'
      };
    });

    const { error: completionsError } = await supabase
      .from('workout_completions')
      .insert(workoutCompletions);

    if (completionsError) {
      console.error('❌ Σφάλμα δημιουργίας workout completions:', completionsError);
      throw new Error('Σφάλμα κατά τη δημιουργία των προπονήσεων');
    }

    console.log('✅ Workout completions created as pending:', workoutCompletions.length);
  }
};
