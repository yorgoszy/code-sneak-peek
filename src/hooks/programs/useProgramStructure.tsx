
import { supabase } from "@/integrations/supabase/client";

export const useProgramStructure = () => {
  const createProgramStructure = async (programId: string, programData: any) => {
    console.log('🏗️ [useProgramStructure] Creating program structure for:', programId);
    console.log('🏗️ [useProgramStructure] Program data:', JSON.stringify(programData, null, 2).substring(0, 500));
    
    if (!programData.weeks || programData.weeks.length === 0) {
      console.log('⚠️ [useProgramStructure] No weeks to create');
      return;
    }

    // Έλεγχος ότι έχουμε πραγματικά ασκήσεις για αποθήκευση
    let totalExercises = 0;
    programData.weeks.forEach((week: any) => {
      week.program_days?.forEach((day: any) => {
        day.program_blocks?.forEach((block: any) => {
          totalExercises += block.program_exercises?.length || 0;
        });
      });
    });
    
    console.log(`🏗️ [useProgramStructure] Total exercises to save: ${totalExercises}`);
    
    try {
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
              is_competition_day: !!day.is_competition_day,
              is_esd_day: !!day.is_esd_day,
              upper_effort: day.upper_effort || 'none',
              lower_effort: day.lower_effort || 'none'
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

          // Ταξινόμηση blocks
          const sortedBlocks = [...day.program_blocks]
            .sort((a, b) => (Number(a.block_order) || 0) - (Number(b.block_order) || 0))
            .map((block, index) => ({
              ...block,
              block_order: index + 1
            }));

          // Valid training types in database
          const VALID_TRAINING_TYPES = [
            'warm up', 'str', 'str/spd', 'pwr', 'spd/str', 'spd', 
            'str/end', 'pwr/end', 'spd/end', 'end', 'hpr', 
            'recovery', 'accessory', 'rotational'
          ];
          
          for (const block of sortedBlocks) {
            console.log('🧱 [useProgramStructure] Creating block:', block.name, 'with', block.program_exercises?.length || 0, 'exercises');
            
            // Validate training_type against database constraint
            let validTrainingType = null;
            if (block.training_type && block.training_type !== '') {
              if (VALID_TRAINING_TYPES.includes(block.training_type)) {
                validTrainingType = block.training_type;
              } else {
                console.warn(`⚠️ [useProgramStructure] Invalid training_type "${block.training_type}" - setting to null`);
              }
            }
            
            const blockInsertData = {
              day_id: dayData.id,
              name: block.name || `Block ${block.block_order}`,
              block_order: block.block_order || 1,
              training_type: validTrainingType,
              workout_format: block.workout_format && block.workout_format !== '' && block.workout_format !== 'none' ? block.workout_format : null,
              workout_duration: block.workout_duration && block.workout_duration !== '' ? block.workout_duration : null,
              block_sets: block.block_sets || 1
            };
            
            const { data: blockData, error: blockError } = await supabase
              .from('program_blocks')
              .insert([blockInsertData])
              .select()
              .single();

            if (blockError) {
              console.error('❌ [useProgramStructure] Error creating block:', blockError, 'Data:', blockInsertData);
              throw blockError;
            }

            console.log('✅ [useProgramStructure] Block created:', blockData.id);

            if (!block.program_exercises || block.program_exercises.length === 0) {
              console.log('⚠️ [useProgramStructure] No exercises to create for block:', block.name);
              continue;
            }

            // Ταξινόμηση ασκήσεων
            const sortedExercises = [...block.program_exercises]
              .sort((a, b) => (Number(a.exercise_order) || 0) - (Number(b.exercise_order) || 0))
              .map((ex, index) => ({
                ...ex,
                exercise_order: index + 1
              }));

            for (const exercise of sortedExercises) {
              if (!exercise.exercise_id) {
                console.log('⚠️ [useProgramStructure] Skipping exercise without exercise_id');
                continue;
              }

              const insertData = {
                block_id: blockData.id,
                exercise_id: exercise.exercise_id,
                sets: exercise.sets || 1,
                reps: exercise.reps || '',
                reps_mode: exercise.reps_mode || 'reps',
                kg: exercise.kg || '',
                kg_mode: exercise.kg_mode || 'kg',
                percentage_1rm: exercise.percentage_1rm ? parseFloat(exercise.percentage_1rm.toString()) : null,
                velocity_ms: exercise.velocity_ms ? parseFloat(exercise.velocity_ms.toString()) : null,
                tempo: exercise.tempo || '',
                rest: exercise.rest || '',
                notes: exercise.notes || '',
                exercise_order: exercise.exercise_order || 1
              };

              const { error: exerciseError } = await supabase
                .from('program_exercises')
                .insert([insertData]);

              if (exerciseError) {
                console.error('❌ [useProgramStructure] Error creating exercise:', exerciseError);
                throw exerciseError;
              }

              console.log('✅ [useProgramStructure] Exercise created:', exercise.exercises?.name || exercise.exercise_id);
            }
          }
        }
      }
      
      console.log('🎉 [useProgramStructure] Program structure creation completed successfully');
    } catch (error) {
      console.error('❌ [useProgramStructure] CRITICAL ERROR during structure creation:', error);
      throw error;
    }
  };

  return {
    createProgramStructure
  };
};
