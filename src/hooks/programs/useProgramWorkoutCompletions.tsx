
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
      
      // Παίρνουμε τις ημέρες από την πρώτη εβδομάδα
      const programWeeks = programStructure.weeks || [];
      if (programWeeks.length === 0) {
        throw new Error('Το πρόγραμμα δεν έχει εβδομάδες');
      }

      const firstWeek = programWeeks[0];
      const daysInWeek = firstWeek.program_days || [];
      
      console.log('📋 Using program structure:', {
        totalWeeks: programWeeks.length,
        daysPerWeek: daysInWeek.length
      });

      // Δημιουργούμε completions για κάθε ημερομηνία προπόνησης
      trainingDates.forEach((scheduledDate, index) => {
        // Κυκλική επανάληψη των ημερών
        const dayIndex = index % daysInWeek.length;
        const dayNumber = dayIndex + 1; // day_number ξεκινάει από 1
        
        // Υπολογίζουμε σε ποια εβδομάδα είμαστε
        const weekNumber = Math.floor(index / daysInWeek.length) + 1;

        console.log(`📅 Date ${index + 1}: ${scheduledDate} -> Week ${weekNumber}, Day ${dayNumber}`);
        
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
      });

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
