
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
    console.log('📅 Creating workout completions with program structure:', {
      weeks: program.weeks?.length,
      totalDates: trainingDatesStrings.length,
      program: program
    });

    // Υπολογίζουμε τις ημέρες ανά εβδομάδα
    const programWeeks = program.weeks || [];
    if (programWeeks.length === 0) {
      throw new Error('Το πρόγραμμα δεν έχει εβδομάδες');
    }

    // Παίρνουμε τις ημέρες από την πρώτη εβδομάδα (υποθέτουμε ότι όλες οι εβδομάδες έχουν τις ίδιες ημέρες)
    const firstWeek = programWeeks[0];
    const daysInWeek = firstWeek.program_days || [];
    
    console.log('📋 Program structure analysis:', {
      totalWeeks: programWeeks.length,
      daysPerWeek: daysInWeek.length,
      dayNames: daysInWeek.map(d => d.name)
    });

    const workoutCompletions = trainingDatesStrings.map((date, index) => {
      // Κυκλική επανάληψη των ημερών
      const dayIndex = index % daysInWeek.length;
      const dayNumber = dayIndex + 1; // day_number ξεκινάει από 1
      
      // Υπολογίζουμε σε ποια εβδομάδα είμαστε
      const weekNumber = Math.floor(index / daysInWeek.length) + 1;

      console.log(`📅 Date ${index + 1}: ${date} -> Week ${weekNumber}, Day ${dayNumber} (${daysInWeek[dayIndex]?.name || 'Unknown'})`);

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

    console.log('💾 Final workout completions to insert:', workoutCompletions);

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
