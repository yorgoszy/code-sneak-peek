
import { supabase } from "@/integrations/supabase/client";

export const useProgramStructure = () => {
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

  return {
    createProgramStructure
  };
};
