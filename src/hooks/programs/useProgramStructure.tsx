
import { supabase } from "@/integrations/supabase/client";

export const useProgramStructure = () => {
  const createProgramStructure = async (programId: string, programData: any) => {
    console.log('🏗️ Creating program structure for:', programId, programData);
    
    if (!programData.weeks || programData.weeks.length === 0) {
      console.log('No weeks to create');
      return;
    }
    
    for (const week of programData.weeks) {
      console.log('📅 Creating week:', week.name, 'with', week.program_days?.length || 0, 'days');
      
      const { data: weekData, error: weekError } = await supabase
        .from('program_weeks')
        .insert([{
          program_id: programId,
          name: week.name,
          week_number: week.week_number
        }])
        .select()
        .single();

      if (weekError) {
        console.error('❌ Error creating week:', weekError);
        throw weekError;
      }

      console.log('✅ Week created:', weekData.id);

      if (!week.program_days || week.program_days.length === 0) {
        console.log('No days to create for week:', week.name);
        continue;
      }

      for (const day of week.program_days) {
        console.log('📋 Creating day:', day.name, 'with', day.program_blocks?.length || 0, 'blocks');
        
        const { data: dayData, error: dayError } = await supabase
          .from('program_days')
          .insert([{
            week_id: weekData.id,
            name: day.name,
            day_number: day.day_number,
            estimated_duration_minutes: day.estimated_duration_minutes || 60
          }])
          .select()
          .single();

        if (dayError) {
          console.error('❌ Error creating day:', dayError);
          throw dayError;
        }

        console.log('✅ Day created:', dayData.id);

        if (!day.program_blocks || day.program_blocks.length === 0) {
          console.log('No blocks to create for day:', day.name);
          continue;
        }

        for (const block of day.program_blocks) {
          console.log('🧱 Creating block:', block.name, 'with', block.program_exercises?.length || 0, 'exercises');
          
          const { data: blockData, error: blockError } = await supabase
            .from('program_blocks')
            .insert([{
              day_id: dayData.id,
              name: block.name,
              block_order: block.block_order
            }])
            .select()
            .single();

          if (blockError) {
            console.error('❌ Error creating block:', blockError);
            throw blockError;
          }

          console.log('✅ Block created:', blockData.id);

          if (!block.program_exercises || block.program_exercises.length === 0) {
            console.log('No exercises to create for block:', block.name);
            continue;
          }

          for (const exercise of block.program_exercises) {
            if (!exercise.exercise_id) {
              console.log('Skipping exercise without exercise_id');
              continue;
            }

            console.log('💪 Creating exercise:', exercise.exercises?.name || 'Unknown', 'with params:', {
              sets: exercise.sets,
              reps: exercise.reps,
              kg: exercise.kg,
              percentage_1rm: exercise.percentage_1rm,
              velocity_ms: exercise.velocity_ms,
              tempo: exercise.tempo,
              rest: exercise.rest
            });

            const { error: exerciseError } = await supabase
              .from('program_exercises')
              .insert([{
                block_id: blockData.id,
                exercise_id: exercise.exercise_id,
                sets: exercise.sets || 1,
                reps: exercise.reps || '',
                kg: exercise.kg || '',
                percentage_1rm: exercise.percentage_1rm ? parseFloat(exercise.percentage_1rm.toString()) : null,
                velocity_ms: exercise.velocity_ms ? parseFloat(exercise.velocity_ms.toString()) : null,
                tempo: exercise.tempo || '',
                rest: exercise.rest || '',
                notes: exercise.notes || '',
                exercise_order: exercise.exercise_order || 1
              }]);

            if (exerciseError) {
              console.error('❌ Error creating exercise:', exerciseError);
              throw exerciseError;
            }

            console.log('✅ Exercise created successfully');
          }
        }
      }
    }
    
    console.log('🎉 Program structure creation completed successfully');
  };

  return {
    createProgramStructure
  };
};
