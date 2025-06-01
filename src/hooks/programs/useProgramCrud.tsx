
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Program } from "@/components/programs/types";

export const useProgramCrud = () => {
  const [loading, setLoading] = useState(false);

  const fetchPrograms = async (): Promise<Program[]> => {
    try {
      setLoading(true);
      console.log('🔍 Fetching programs...');
      
      const { data, error } = await supabase
        .from('programs')
        .select(`
          *,
          app_users!programs_user_id_fkey (
            name,
            photo_url
          ),
          program_weeks (
            *,
            program_days (
              *,
              program_blocks (
                *,
                program_exercises (
                  *,
                  exercises (name)
                )
              )
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching programs:', error);
        return [];
      }

      // Transform the data to match our Program interface
      const transformedData = data?.map((program: any) => ({
        ...program,
        app_users: Array.isArray(program.app_users) && program.app_users.length > 0 
          ? program.app_users[0] 
          : null
      })) || [];

      console.log('✅ Programs fetched successfully:', transformedData?.length);
      return transformedData;
    } catch (error) {
      console.error('❌ Unexpected error:', error);
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

      if (error) {
        console.error('Error deleting program:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Unexpected error deleting program:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const duplicateProgram = async (program: Program, saveProgram: (data: any) => Promise<void>) => {
    try {
      setLoading(true);
      
      const duplicatedProgram = {
        ...program,
        name: `${program.name} (Αντίγραφο)`,
        id: undefined,
        user_id: undefined,
        app_users: null
      };

      await saveProgram(duplicatedProgram);
    } catch (error) {
      console.error('Error duplicating program:', error);
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
