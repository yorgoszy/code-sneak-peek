
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Program } from "@/components/programs/types";

export const useProgramCrud = () => {
  const [loading, setLoading] = useState(false);

  const fetchPrograms = async (): Promise<Program[]> => {
    setLoading(true);
    try {
      console.log('Fetching programs...');
      
      // First, get all program IDs that have active assignments
      const { data: assignedProgramIds, error: assignmentsError } = await supabase
        .from('program_assignments')
        .select('program_id')
        .eq('status', 'active');

      if (assignmentsError) {
        console.error('Error fetching assigned programs:', assignmentsError);
      }

      const assignedIds = assignedProgramIds?.map(a => a.program_id) || [];
      console.log('Assigned program IDs:', assignedIds);

      // Then fetch programs, excluding those that are assigned
      let query = supabase
        .from('programs')
        .select(`
          *,
          app_users!programs_user_id_fkey(id, name, email),
          program_weeks(
            id,
            name,
            week_number,
            program_days(
              id,
              name,
              day_number,
              program_blocks(
                id,
                name,
                block_order,
                program_exercises(
                  id,
                  sets,
                  reps,
                  kg,
                  percentage_1rm,
                  velocity_ms,
                  rest,
                  tempo,
                  notes,
                  exercise_order,
                  exercises(id, name, description, video_url)
                )
              )
            )
          )
        `)
        .order('created_at', { ascending: false });

      // Exclude assigned programs if there are any
      if (assignedIds.length > 0) {
        query = query.not('id', 'in', `(${assignedIds.join(',')})`);
      }

      const { data: programs, error } = await query;

      if (error) {
        console.error('Error fetching programs:', error);
        toast.error('Σφάλμα φόρτωσης προγραμμάτων');
        return [];
      }

      console.log('Fetched programs (excluding assigned):', programs?.length || 0);
      
      // Transform the data to match the Program type
      const transformedPrograms = programs?.map(program => ({
        ...program,
        app_users: Array.isArray(program.app_users) && program.app_users.length > 0 
          ? program.app_users[0] 
          : null
      })) || [];

      return transformedPrograms as Program[];
    } catch (error) {
      console.error('Unexpected error fetching programs:', error);
      toast.error('Απροσδόκητο σφάλμα φόρτωσης προγραμμάτων');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const deleteProgram = async (programId: string): Promise<boolean> => {
    try {
      console.log('Deleting program:', programId);
      
      // Check if program has active assignments
      const { data: assignments, error: assignmentsError } = await supabase
        .from('program_assignments')
        .select('id')
        .eq('program_id', programId)
        .eq('status', 'active');

      if (assignmentsError) {
        console.error('Error checking assignments:', assignmentsError);
        toast.error('Σφάλμα ελέγχου αναθέσεων');
        return false;
      }

      if (assignments && assignments.length > 0) {
        toast.error('Δεν μπορείτε να διαγράψετε πρόγραμμα που έχει ενεργές αναθέσεις');
        return false;
      }

      const { error } = await supabase
        .from('programs')
        .delete()
        .eq('id', programId);

      if (error) {
        console.error('Error deleting program:', error);
        toast.error('Σφάλμα διαγραφής προγράμματος');
        return false;
      }

      toast.success('Το πρόγραμμα διαγράφηκε επιτυχώς');
      return true;
    } catch (error) {
      console.error('Unexpected error deleting program:', error);
      toast.error('Απροσδόκητο σφάλμα διαγραφής');
      return false;
    }
  };

  const duplicateProgram = async (program: Program, saveProgram: (data: any) => Promise<any>): Promise<boolean> => {
    try {
      console.log('Duplicating program:', program.name);
      
      const duplicatedProgram = {
        ...program,
        id: undefined, // Remove ID to create new program
        name: `${program.name} (Αντίγραφο)`,
        created_at: undefined,
        updated_at: undefined,
        user_id: null, // Reset user assignment
        status: 'draft' // Reset to draft status
      };

      await saveProgram(duplicatedProgram);
      toast.success('Το πρόγραμμα αντιγράφηκε επιτυχώς');
      return true;
    } catch (error) {
      console.error('Error duplicating program:', error);
      toast.error('Σφάλμα αντιγραφής προγράμματος');
      return false;
    }
  };

  return {
    loading,
    fetchPrograms,
    deleteProgram,
    duplicateProgram
  };
};
