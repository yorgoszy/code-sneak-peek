
import { supabase } from "@/integrations/supabase/client";

export const assignmentService = {
  async createAssignment(
    savedProgram: any,
    userId: string,
    trainingDatesStrings: string[]
  ) {
    const sortedDates = [...trainingDatesStrings].sort();
    const startDate = sortedDates[0];
    const endDate = sortedDates[sortedDates.length - 1];

    const { data: assignment, error: assignmentError } = await supabase
      .from('program_assignments')
      .insert({
        program_id: savedProgram.id,
        user_id: userId,
        training_dates: trainingDatesStrings,
        start_date: startDate,
        end_date: endDate,
        status: 'active',
        assignment_type: 'individual',
        progress: 0
      })
      .select()
      .single();

    if (assignmentError) {
      console.error('❌ Σφάλμα δημιουργίας ανάθεσης:', assignmentError);
      throw new Error('Σφάλμα κατά την ανάθεση του προγράμματος');
    }

    return assignment;
  }
};
