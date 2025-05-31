import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Program } from "@/components/programs/types";

export const useProgramOperations = () => {
  const [loading, setLoading] = useState(false);

  const fetchPrograms = async () => {
    setLoading(true);
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

    if (error) {
      toast.error('Σφάλμα φόρτωσης προγραμμάτων');
      console.error(error);
      return [];
    } else {
      setLoading(false);
      return data || [];
    }
  };

  const createProgramFromBuilder = async (programData: any) => {
    console.log('createProgramFromBuilder called', programData);
    
    if (!programData.name) {
      toast.error('Το όνομα προγράμματος είναι υποχρεωτικό');
      return;
    }

    try {
      if (programData.id) {
        await updateExistingProgram(programData);
      } else {
        await createNewProgram(programData);
      }
      return await fetchPrograms();
    } catch (error) {
      console.error('Error saving program:', error);
      toast.error('Σφάλμα αποθήκευσης προγράμματος');
      throw error;
    }
  };

  const createNewProgram = async (programData: any) => {
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
  };

  const updateExistingProgram = async (programData: any) => {
    const { error: programError } = await supabase
      .from('programs')
      .update({
        name: programData.name,
        description: programData.description,
        athlete_id: programData.athlete_id || null
      })
      .eq('id', programData.id);

    if (programError) throw programError;

    await supabase.from('program_weeks').delete().eq('program_id', programData.id);
    await createProgramStructure(programData.id, programData);
    toast.success('Το πρόγραμμα ενημερώθηκε επιτυχώς');
  };

  const createProgramStructure = async (programId: string, programData: any) => {
    for (const week of programData.weeks) {
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

      for (const day of week.days) {
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

        for (const block of day.blocks) {
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

          for (const exercise of block.exercises) {
            if (!exercise.exercise_id) continue;

            let calculatedKg = exercise.kg;
            let suggestedVelocity = null;

            if (programData.athlete_id && exercise.percentage_1rm > 0) {
              const { data: oneRmData } = await supabase
                .rpc('get_latest_1rm', {
                  athlete_id: programData.athlete_id,
                  exercise_id: exercise.exercise_id
                });

              if (oneRmData) {
                calculatedKg = Math.round(oneRmData * (exercise.percentage_1rm / 100)).toString();
                
                const { data: velocityData } = await supabase
                  .rpc('get_suggested_velocity', {
                    athlete_id: programData.athlete_id,
                    exercise_id: exercise.exercise_id,
                    percentage: exercise.percentage_1rm
                  });

                if (velocityData) {
                  suggestedVelocity = velocityData;
                }
              }
            }

            const { error: exerciseError } = await supabase
              .from('program_exercises')
              .insert([{
                block_id: blockData.id,
                exercise_id: exercise.exercise_id,
                sets: exercise.sets,
                reps: exercise.reps,
                kg: calculatedKg,
                percentage_1rm: exercise.percentage_1rm || null,
                velocity_ms: exercise.velocity_ms ? parseFloat(exercise.velocity_ms) : suggestedVelocity,
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

      await createProgramFromBuilder(duplicatedProgramData);
      toast.success('Το πρόγραμμα αντιγράφηκε επιτυχώς');
      return await fetchPrograms();
    } catch (error) {
      console.error('Error duplicating program:', error);
      toast.error('Σφάλμα αντιγραφής προγράμματος');
      throw error;
    }
  };

  const deleteProgram = async (programId: string, selectedProgram: Program | null, setSelectedProgram: (program: Program | null) => void) => {
    if (!confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτό το πρόγραμμα;')) return false;

    const { error } = await supabase
      .from('programs')
      .delete()
      .eq('id', programId);

    if (error) {
      toast.error('Σφάλμα διαγραφής προγράμματος');
      console.error(error);
      return false;
    } else {
      toast.success('Το πρόγραμμα διαγράφηκε επιτυχώς');
      if (selectedProgram?.id === programId) {
        setSelectedProgram(null);
      }
      return true;
    }
  };

  const deleteWeek = async (weekId: string) => {
    if (!confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την εβδομάδα;')) return false;

    const { error } = await supabase
      .from('program_weeks')
      .delete()
      .eq('id', weekId);

    if (error) {
      toast.error('Σφάλμα διαγραφής εβδομάδας');
      console.error(error);
      return false;
    } else {
      toast.success('Η εβδομάδα διαγράφηκε επιτυχώς');
      return true;
    }
  };

  const deleteDay = async (dayId: string) => {
    if (!confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την ημέρα;')) return false;

    const { error } = await supabase
      .from('program_days')
      .delete()
      .eq('id', dayId);

    if (error) {
      toast.error('Σφάλμα διαγραφής ημέρας');
      console.error(error);
      return false;
    } else {
      toast.success('Η ημέρα διαγράφηκε επιτυχώς');
      return true;
    }
  };

  const deleteBlock = async (blockId: string) => {
    if (!confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτό το block;')) return false;

    const { error } = await supabase
      .from('program_blocks')
      .delete()
      .eq('id', blockId);

    if (error) {
      toast.error('Σφάλμα διαγραφής block');
      console.error(error);
      return false;
    } else {
      toast.success('Το block διαγράφηκε επιτυχώς');
      return true;
    }
  };

  const deleteExercise = async (exerciseId: string) => {
    if (!confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την άσκηση;')) return false;

    const { error } = await supabase
      .from('program_exercises')
      .delete()
      .eq('id', exerciseId);

    if (error) {
      toast.error('Σφάλμα διαγραφής άσκησης');
      console.error(error);
      return false;
    } else {
      toast.success('Η άσκηση διαγράφηκε επιτυχώς');
      return true;
    }
  };

  return {
    loading,
    fetchPrograms,
    createProgramFromBuilder,
    duplicateProgram,
    deleteProgram,
    deleteWeek,
    deleteDay,
    deleteBlock,
    deleteExercise
  };
};
