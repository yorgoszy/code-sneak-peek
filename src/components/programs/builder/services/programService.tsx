
import { supabase } from "@/integrations/supabase/client";
import type { ProgramStructure } from '../hooks/useProgramBuilderState';

export const programService = {
  async saveProgram(program: ProgramStructure) {
    console.log('✅ Saving program:', program);

    // Απλή αποθήκευση προγράμματος χωρίς τη δομή (που θα γίνει στο useProgramSave)
    const { data: savedProgram, error: programError } = await supabase
      .from('programs')
      .insert({
        name: program.name,
        description: program.description || '',
        status: 'draft',
        type: 'strength'
      })
      .select()
      .single();

    if (programError) {
      console.error('❌ Error saving program:', programError);
      throw new Error('Σφάλμα κατά την αποθήκευση του προγράμματος');
    }

    console.log('✅ Program saved successfully:', savedProgram);
    return savedProgram;
  },

  // Αυτή η μέθοδος δεν χρησιμοποιείται πλέον - η δομή αποθηκεύεται στο useProgramStructure
  async saveProgramStructure(savedProgram: any, program: ProgramStructure) {
    console.log('⚠️ This method is deprecated - use useProgramStructure instead');
    return;
  }
};
