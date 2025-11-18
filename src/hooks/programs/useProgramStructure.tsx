
import { supabase } from "@/integrations/supabase/client";

export const useProgramStructure = () => {
  const createProgramStructure = async (programId: string, programData: any) => {
    console.log('🏗️ [useProgramStructure] Creating program structure for:', programId, programData);
    
    if (!programData.weeks || programData.weeks.length === 0) {
      console.log('⚠️ [useProgramStructure] No weeks to create');
      return;
    }
    
    for (const week of programData.weeks) {
      console.log('📅 [useProgramStructure] Creating week:', week.name, 'with', week.program_days?.length || 0, 'days');
      
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
        console.error('❌ [useProgramStructure] Error creating week:', weekError);
        throw weekError;
      }

      console.log('✅ [useProgramStructure] Week created:', weekData.id);

      if (!week.program_days || week.program_days.length === 0) {
        console.log('⚠️ [useProgramStructure] No days to create for week:', week.name);
        continue;
      }

      for (const day of week.program_days) {
        console.log('📋 [useProgramStructure] Creating day:', day.name, 'with', day.program_blocks?.length || 0, 'blocks');
        
        const { data: dayData, error: dayError } = await supabase
          .from('program_days')
          .insert([{
            week_id: weekData.id,
            name: day.name,
            day_number: day.day_number,
            estimated_duration_minutes: day.estimated_duration_minutes || 60,
            is_test_day: !!day.is_test_day,
            test_types: day.test_types || [],
            is_competition_day: !!day.is_competition_day
          }])
          .select()
          .single();

        if (dayError) {
          console.error('❌ [useProgramStructure] Error creating day:', dayError);
          throw dayError;
        }

        console.log('✅ [useProgramStructure] Day created:', dayData.id);

        if (!day.program_blocks || day.program_blocks.length === 0) {
          console.log('⚠️ [useProgramStructure] No blocks to create for day:', day.name);
          continue;
        }

        // 🚨 ΚΡΙΤΙΚΗ ΔΙΟΡΘΩΣΗ: Ταξινόμηση και επαναδιαμόρφωση block_order
        const sortedBlocks = [...day.program_blocks]
          .sort((a, b) => {
            const orderA = Number(a.block_order) || 0;
            const orderB = Number(b.block_order) || 0;
            return orderA - orderB;
          })
          .map((block, index) => ({
            ...block,
            block_order: index + 1 // Επαναδιαμόρφωση σε 1, 2, 3...
          }));

        console.log(`🚨 [FIXED] Correctly sorted blocks for day ${day.name}:`);
        sortedBlocks.forEach((blk, index) => {
          console.log(`🚨   ${index + 1}. ${blk.name} (order: ${blk.block_order})`);
        });

        for (const block of sortedBlocks) {
          console.log('🧱 [useProgramStructure] Creating block:', block.name, 'with', block.program_exercises?.length || 0, 'exercises');
          
          const { data: blockData, error: blockError } = await supabase
            .from('program_blocks')
            .insert([{
              day_id: dayData.id,
              name: block.name,
              block_order: block.block_order,
              training_type: block.training_type || null,
              workout_format: block.workout_format || null,
              workout_duration: block.workout_duration || null
            }])
            .select()
            .single();

          if (blockError) {
            console.error('❌ [useProgramStructure] Error creating block:', blockError);
            throw blockError;
          }

          console.log('✅ [useProgramStructure] Block created:', blockData.id);

          if (!block.program_exercises || block.program_exercises.length === 0) {
            console.log('⚠️ [useProgramStructure] No exercises to create for block:', block.name);
            continue;
          }

          // 🚨 ΚΡΙΤΙΚΗ ΔΙΟΡΘΩΣΗ: Ταξινόμηση μόνο με βάση το exercise_order
          console.log('🚨 [CRITICAL FIX] Original exercises order in block:', block.name);
          block.program_exercises.forEach((ex, index) => {
            console.log(`🚨   ${index + 1}. ${ex.exercises?.name} (order: ${ex.exercise_order})`);
          });

          // ΣΩΣΤΗ ταξινόμηση και επαναδιαμόρφωση exercise_order
          const sortedExercises = [...block.program_exercises]
            .sort((a, b) => {
              const orderA = Number(a.exercise_order) || 0;
              const orderB = Number(b.exercise_order) || 0;
              return orderA - orderB;
            })
            .map((ex, index) => ({
              ...ex,
              exercise_order: index + 1 // Επαναδιαμόρφωση σε 1, 2, 3...
            }));

          console.log('🚨 [FIXED] Correctly sorted exercises order:');
          sortedExercises.forEach((ex, index) => {
            console.log(`🚨   ${index + 1}. ${ex.exercises?.name} (order: ${ex.exercise_order})`);
          });

          for (const exercise of sortedExercises) {
            if (!exercise.exercise_id) {
              console.log('⚠️ [useProgramStructure] Skipping exercise without exercise_id');
              continue;
            }

            console.log('💪 [useProgramStructure] Creating exercise:', exercise.exercises?.name || 'Unknown', 'with order:', exercise.exercise_order);

            const insertData = {
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
              exercise_order: exercise.exercise_order || 1 // 🚨 ΚΡΙΤΙΚΟ: Διατηρούμε τη σειρά
            };

            console.log('🚨 [FIXED] Insert data for exercise:', exercise.exercises?.name, insertData);

            const { error: exerciseError } = await supabase
              .from('program_exercises')
              .insert([insertData]);

            if (exerciseError) {
              console.error('❌ [useProgramStructure] Error creating exercise:', exerciseError);
              throw exerciseError;
            }

            console.log('✅ [useProgramStructure] Exercise created successfully with order:', exercise.exercise_order);
          }
        }
      }
    }
    
    console.log('🎉 [useProgramStructure] Program structure creation completed successfully');
  };

  return {
    createProgramStructure
  };
};
