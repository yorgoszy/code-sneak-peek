
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Program } from "@/components/programs/types";

export const usePrograms = () => {
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

  const createProgramStructure = async (programId: string, programData: any) => {
    console.log('Creating program structure for:', programId, programData);
    
    for (const week of programData.weeks || []) {
      const { data: weekData, error: weekError } = await supabase
        .from('program_weeks')
        .insert([{
          program_id: programId,
          name: week.name,
          week_number: week.week_number
        }])
        .select()
        .single();

      if (weekError) throw weekError;

      for (const day of week.days || []) {
        const { data: dayData, error: dayError } = await supabase
          .from('program_days')
          .insert([{
            week_id: weekData.id,
            name: day.name,
            day_number: day.day_number
          }])
          .select()
          .single();

        if (dayError) throw dayError;

        for (const block of day.blocks || []) {
          const { data: blockData, error: blockError } = await supabase
            .from('program_blocks')
            .insert([{
              day_id: dayData.id,
              name: block.name,
              block_order: block.block_order
            }])
            .select()
            .single();

          if (blockError) throw blockError;

          for (const exercise of block.exercises || []) {
            if (!exercise.exercise_id) continue;

            const { error: exerciseError } = await supabase
              .from('program_exercises')
              .insert([{
                block_id: blockData.id,
                exercise_id: exercise.exercise_id,
                sets: exercise.sets,
                reps: exercise.reps,
                kg: exercise.kg,
                percentage_1rm: exercise.percentage_1rm || null,
                velocity_ms: exercise.velocity_ms ? parseFloat(exercise.velocity_ms) : null,
                tempo: exercise.tempo,
                rest: exercise.rest,
                notes: '',
                exercise_order: exercise.exercise_order
              }]);

            if (exerciseError) throw exerciseError;
          }
        }
      }
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

  const duplicateProgram = async (originalProgram: Program) => {
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
    saveProgram,
    deleteProgram,
    duplicateProgram
  };
};
