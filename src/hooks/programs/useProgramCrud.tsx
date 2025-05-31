
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Program } from "@/components/programs/types";

export const useProgramCrud = () => {
  const [loading, setLoading] = useState(false);

  const fetchPrograms = async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const deleteProgram = async (programId: string) => {
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

  const duplicateProgram = async (originalProgram: Program, saveProgram: (data: any) => Promise<void>) => {
    try {
      const duplicatedProgramData = {
        name: `${originalProgram.name} (Αντίγραφο)`,
        description: originalProgram.description,
        athlete_id: originalProgram.athlete_id,
        weeks: originalProgram.program_weeks?.map(week => ({
          name: week.name,
          week_number: week.week_number,
          days: week.program_days?.map(day => ({
            name: day.name,
            day_number: day.day_number,
            blocks: day.program_blocks?.map(block => ({
              name: block.name,
              block_order: block.block_order,
              exercises: block.program_exercises?.map(exercise => ({
                exercise_id: exercise.exercise_id,
                sets: exercise.sets,
                reps: exercise.reps,
                kg: exercise.kg,
                percentage_1rm: exercise.percentage_1rm,
                velocity_ms: exercise.velocity_ms,
                tempo: exercise.tempo,
                rest: exercise.rest,
                exercise_order: exercise.exercise_order
              })) || []
            })) || []
          })) || []
        })) || []
      };

      await saveProgram(duplicatedProgramData);
      toast.success('Το πρόγραμμα αντιγράφηκε επιτυχώς');
    } catch (error) {
      console.error('Error duplicating program:', error);
      toast.error('Σφάλμα αντιγραφής προγράμματος');
      throw error;
    }
  };

  return {
    loading,
    fetchPrograms,
    deleteProgram,
    duplicateProgram
  };
};
