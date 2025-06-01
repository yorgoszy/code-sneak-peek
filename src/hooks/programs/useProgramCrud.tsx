
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Program } from "@/components/programs/types";

export const useProgramCrud = () => {
  const [loading, setLoading] = useState(false);

  const fetchPrograms = async (): Promise<Program[]> => {
    try {
      setLoading(true);
      console.log('🔍 Fetching programs...');

      // First try with foreign key references
      const { data, error } = await supabase
        .from('programs')
        .select(`
          *,
          app_users!fk_programs_created_by(name),
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

      if (error) {
        console.error('Error with foreign key query:', error);
        // Fallback to simple query without joins that might fail
        const { data: simpleData, error: simpleError } = await supabase
          .from('programs')
          .select(`
            *,
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

        if (simpleError) throw simpleError;
        
        return (simpleData || []).map(program => ({
          ...program,
          app_users: null
        }));
      }

      // Transform data to handle potential query errors
      return (data || []).map(program => ({
        ...program,
        app_users: program.app_users && typeof program.app_users === 'object' && 'name' in program.app_users 
          ? program.app_users as any 
          : null
      }));
    } catch (error) {
      console.error('Error fetching programs:', error);
      toast.error('Σφάλμα φόρτωσης προγραμμάτων');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const deleteProgram = async (programId: string): Promise<boolean> => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('programs')
        .delete()
        .eq('id', programId);

      if (error) throw error;
      
      toast.success('Το πρόγραμμα διαγράφηκε επιτυχώς');
      return true;
    } catch (error) {
      console.error('Error deleting program:', error);
      toast.error('Σφάλμα κατά τη διαγραφή του προγράμματος');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const duplicateProgram = async (program: Program, saveProgram: (data: any) => Promise<void>): Promise<void> => {
    try {
      setLoading(true);
      
      const duplicatedProgram = {
        ...program,
        id: undefined,
        name: `${program.name} (Αντίγραφο)`,
        created_at: undefined,
        updated_at: undefined,
        program_weeks: program.program_weeks?.map(week => ({
          ...week,
          id: undefined,
          program_id: undefined,
          program_days: week.program_days?.map(day => ({
            ...day,
            id: undefined,
            week_id: undefined,
            program_blocks: day.program_blocks?.map(block => ({
              ...block,
              id: undefined,
              day_id: undefined,
              program_exercises: block.program_exercises?.map(exercise => ({
                ...exercise,
                id: undefined,
                block_id: undefined
              })) || []
            })) || []
          })) || []
        })) || []
      };

      await saveProgram(duplicatedProgram);
      toast.success('Το πρόγραμμα αντιγράφηκε επιτυχώς');
    } catch (error) {
      console.error('Error duplicating program:', error);
      toast.error('Σφάλμα κατά την αντιγραφή του προγράμματος');
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    fetchPrograms,
    deleteProgram,
    duplicateProgram
  };
};
