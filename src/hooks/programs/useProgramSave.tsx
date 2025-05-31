
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useProgramStructure } from './useProgramStructure';
import { useProgramAssignments } from './useProgramAssignments';

export const useProgramSave = () => {
  const [loading, setLoading] = useState(false);
  const { createProgramStructure } = useProgramStructure();
  const { createOrUpdateAssignment } = useProgramAssignments();

  const saveProgram = async (programData: any) => {
    setLoading(true);
    try {
      console.log('Saving program data:', programData);
      
      if (programData.id) {
        // Update existing program
        const { error: programError } = await supabase
          .from('programs')
          .update({
            name: programData.name,
            description: programData.description,
            athlete_id: programData.athlete_id || null
          })
          .eq('id', programData.id);

        if (programError) throw programError;

        // Delete old structure
        await supabase.from('program_weeks').delete().eq('program_id', programData.id);
        
        // Create new structure
        await createProgramStructure(programData.id, programData);
        
        // If athlete_id is provided, create or update assignment
        if (programData.athlete_id) {
          await createOrUpdateAssignment(programData.id, programData.athlete_id);
        }
        
        toast.success('Το πρόγραμμα ενημερώθηκε επιτυχώς');
      } else {
        // Create new program
        const { data: program, error: programError } = await supabase
          .from('programs')
          .insert([{
            name: programData.name,
            description: programData.description,
            athlete_id: programData.athlete_id || null
          }])
          .select()
          .single();

        if (programError) throw programError;

        await createProgramStructure(program.id, programData);
        
        // If athlete_id is provided, create assignment
        if (programData.athlete_id) {
          await createOrUpdateAssignment(program.id, programData.athlete_id);
        }
        
        toast.success('Το πρόγραμμα δημιουργήθηκε επιτυχώς');
      }
    } catch (error) {
      console.error('Error saving program:', error);
      toast.error('Σφάλμα αποθήκευσης προγράμματος');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    saveProgram
  };
};
