
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
    console.log('📅 [workoutCompletionService] Creating workout completions with program structure:', {
      programWeeks: program.weeks?.length,
      trainingDates: trainingDatesStrings.length,
      userId
    });

    // 🔍 ΑΝΑΛΥΣΗ ΔΟΜΗΣ ΠΡΟΓΡΑΜΜΑΤΟΣ
    console.log('🔍 [workoutCompletionService] Program structure analysis:');
    program.weeks?.forEach((week, wIndex) => {
      console.log(`🔍  Week ${wIndex + 1}: ${week.name} - ${week.program_days?.length || 0} days`);
      week.program_days?.forEach((day, dIndex) => {
        console.log(`🔍    Day ${dIndex + 1}: ${day.name} - ${day.program_blocks?.length || 0} blocks`);
        day.program_blocks?.forEach((block, bIndex) => {
          console.log(`🔍      Block ${bIndex + 1}: ${block.name} - ${block.program_exercises?.length || 0} exercises`);
          block.program_exercises?.forEach((ex, eIndex) => {
            console.log(`🔍        Exercise ${eIndex + 1}: ${ex.exercises?.name} (order: ${ex.exercise_order})`);
          });
        });
      });
    });

    const totalDaysInProgram = program.weeks?.reduce((total, week) => total + (week.program_days?.length || 0), 0) || 1;
    
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
      console.error('❌ [workoutCompletionService] Σφάλμα δημιουργίας workout completions:', completionsError);
      throw new Error('Σφάλμα κατά τη δημιουργία των προπονήσεων');
    }

    console.log('✅ [workoutCompletionService] Workout completions created as pending:', workoutCompletions.length);
  }
};
