
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Program } from "@/components/programs/types";
import { createProgramStructure } from "./programStructureUtils";

export const fetchPrograms = async () => {
  try {
    const { data, error } = await supabase
      .from('programs')
      .select(`
        *,
        app_users(name),
        program_weeks(
          *,
          program_days(
            *,
            program_blocks(
              *,
              program_exercises(
                *,
                exercises(name)
              )
            )
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    console.log('Fetched programs:', data);
    return data || [];
  } catch (error) {
    console.error('Error fetching programs:', error);
    toast.error('Σφάλμα φόρτωσης προγραμμάτων');
    return [];
  }
};

export const saveProgram = async (programData: any) => {
  try {
    console.log('Saving program data:', programData);
    
    if (programData.id) {
      // Update existing program
      const { error: programError } = await supabase
        .from('programs')
        .update({
          name: programData.name,
          description: programData.description,
          athlete_id: programData.athlete_id || null,
          start_date: programData.start_date || null,
          training_days: programData.training_days || null
        })
        .eq('id', programData.id);

      if (programError) throw programError;

      // Delete old structure
      await supabase.from('program_weeks').delete().eq('program_id', programData.id);
      
      // Create new structure
      await createProgramStructure(programData.id, programData);
      toast.success('Το πρόγραμμα ενημερώθηκε επιτυχώς');
    } else {
      // Create new program
      const { data: program, error: programError } = await supabase
        .from('programs')
        .insert([{
          name: programData.name,
          description: programData.description,
          athlete_id: programData.athlete_id || null,
          start_date: programData.start_date || null,
          training_days: programData.training_days || null
        }])
        .select()
        .single();

      if (programError) throw programError;

      await createProgramStructure(program.id, programData);
      toast.success('Το πρόγραμμα δημιουργήθηκε επιτυχώς');
    }
  } catch (error) {
    console.error('Error saving program:', error);
    toast.error('Σφάλμα αποθήκευσης προγράμματος');
    throw error;
  }
};

export const deleteProgram = async (programId: string) => {
  if (!confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτό το πρόγραμμα;')) return false;

  try {
    const { error } = await supabase
      .from('programs')
      .delete()
      .eq('id', programId);

    if (error) throw error;
    toast.success('Το πρόγραμμα διαγράφηκε επιτυχώς');
    return true;
  } catch (error) {
    console.error('Error deleting program:', error);
    toast.error('Σφάλμα διαγραφής προγράμματος');
    return false;
  }
};
