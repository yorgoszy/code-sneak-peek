
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

      // Simple query to get all programs with their structure
      const { data, error } = await supabase
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

      if (error) {
        console.error('Error fetching programs:', error);
        toast.error('Σφάλμα φόρτωσης προγραμμάτων');
        return [];
      }

      console.log('✅ Programs fetched successfully:', data?.length || 0);
      
      // Transform data to match the expected format
      return (data || []).map(program => ({
        ...program,
        app_users: null // Set to null since we're not fetching user data for now
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

  const duplicateProgram = async (program: Program, saveProgram: (data: any) => Promise<any>): Promise<any> => {
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

      const savedProgram = await saveProgram(duplicatedProgram);
      toast.success('Το πρόγραμμα αντιγράφηκε επιτυχώς');
      return savedProgram;
    } catch (error) {
      console.error('Error duplicating program:', error);
      toast.error('Σφάλμα κατά την αντιγραφή του προγράμματος');
      throw error;
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
