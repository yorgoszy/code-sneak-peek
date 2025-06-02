
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Program } from '@/components/programs/types';

export const useProgramCrud = () => {
  const [loading, setLoading] = useState(false);

  const fetchPrograms = async (): Promise<Program[]> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('programs')
        .select(`
          *,
          app_users(*),
          program_weeks(
            *,
            program_days(
              *,
              program_blocks(
                *,
                program_exercises(
                  *,
                  exercises(*)
                )
              )
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching programs:', error);
      toast.error('Σφάλμα φόρτωσης προγραμμάτων');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchProgramsWithAssignments = async (): Promise<Program[]> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('programs')
        .select(`
          *,
          app_users(*),
          program_weeks(
            *,
            program_days(
              *,
              program_blocks(
                *,
                program_exercises(
                  *,
                  exercises(*)
                )
              )
            )
          ),
          program_assignments(
            id,
            user_id,
            training_dates,
            status,
            start_date,
            end_date,
            created_at,
            app_users(
              id,
              name,
              email,
              photo_url
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching programs with assignments:', error);
      toast.error('Σφάλμα φόρτωσης προγραμμάτων');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const deleteProgram = async (programId: string): Promise<boolean> => {
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

  const duplicateProgram = async (program: Program, saveProgram: (data: any) => Promise<any>) => {
    try {
      const duplicatedProgram = {
        ...program,
        id: undefined,
        name: `${program.name} (Αντίγραφο)`,
        user_id: null,
        created_at: undefined,
        updated_at: undefined,
      };

      await saveProgram(duplicatedProgram);
      toast.success('Το πρόγραμμα αντιγράφηκε επιτυχώς');
    } catch (error) {
      console.error('Error duplicating program:', error);
      toast.error('Σφάλμα αντιγραφής προγράμματος');
    }
  };

  return {
    loading,
    fetchPrograms,
    fetchProgramsWithAssignments,
    deleteProgram,
    duplicateProgram
  };
};
