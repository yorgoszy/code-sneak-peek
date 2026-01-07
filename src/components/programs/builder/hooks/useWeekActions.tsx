
import { ProgramStructure } from './useProgramBuilderState';

export const useWeekActions = (
  program: ProgramStructure,
  updateProgram: (updates: Partial<ProgramStructure>) => void,
  generateId: () => string,
  saveProgram?: (programData: any) => Promise<any>
) => {
  const createDefaultBlocks = () => [
    { id: generateId(), name: 'warm up', training_type: 'warm up' as any, block_order: 1, workout_format: undefined, workout_duration: '', block_sets: 1, program_exercises: [] },
    { id: generateId(), name: 'pwr', training_type: 'pwr' as any, block_order: 2, workout_format: undefined, workout_duration: '', block_sets: 1, program_exercises: [] },
    { id: generateId(), name: 'str', training_type: 'str' as any, block_order: 3, workout_format: undefined, workout_duration: '', block_sets: 1, program_exercises: [] },
    { id: generateId(), name: 'end', training_type: 'end' as any, block_order: 4, workout_format: undefined, workout_duration: '', block_sets: 1, program_exercises: [] },
    { id: generateId(), name: 'rot', training_type: 'rotational' as any, block_order: 5, workout_format: undefined, workout_duration: '', block_sets: 1, program_exercises: [] },
    { id: generateId(), name: 'acc', training_type: 'accessory' as any, block_order: 6, workout_format: undefined, workout_duration: '', block_sets: 1, program_exercises: [] },
    { id: generateId(), name: 'rec', training_type: 'recovery' as any, block_order: 7, workout_format: undefined, workout_duration: '', block_sets: 1, program_exercises: [] }
  ];

  const addWeek = () => {
    const weekNumber = (program.weeks?.length || 0) + 1;
    
    // Δημιουργούμε 3 ημέρες με τα default blocks
    const defaultDays = [1, 2, 3].map(dayNum => ({
      id: generateId(),
      name: `Day ${dayNum}`,
      day_number: dayNum,
      program_blocks: createDefaultBlocks()
    }));

    const newWeek = {
      id: generateId(),
      name: `Week ${weekNumber}`,
      week_number: weekNumber,
      program_days: defaultDays
    };

    const updatedWeeks = [...(program.weeks || []), newWeek];
    updateProgram({ weeks: updatedWeeks });
  };

  const removeWeek = (weekId: string) => {
    const updatedWeeks = (program.weeks || []).filter(week => week.id !== weekId);
    updateProgram({ weeks: updatedWeeks });
  };

  const duplicateWeek = async (weekId: string) => {
    const weekToDuplicate = program.weeks?.find(week => week.id === weekId);
    if (!weekToDuplicate) return;

    console.log('🚨 [DUPLICATE WEEK] Original week structure before duplication:', weekToDuplicate);

    // Δημιουργούμε το νέο week structure με fresh IDs
    const newWeekData = {
      id: generateId(),
      name: `${weekToDuplicate.name} (Αντίγραφο)`,
      week_number: (program.weeks?.length || 0) + 1,
      program_days: weekToDuplicate.program_days.map(day => {
        console.log(`🚨 [DUPLICATE WEEK] Processing day: ${day.name}`);
        
        return {
          id: generateId(),
          name: day.name,
          day_number: day.day_number,
          estimated_duration_minutes: day.estimated_duration_minutes,
          program_blocks: day.program_blocks.map(block => {
            console.log(`🚨 [DUPLICATE WEEK] Processing block: ${block.name} with ${block.program_exercises?.length || 0} exercises`);
            
            // Ταξινόμηση των ασκήσεων με βάση το exercise_order ΠΡΙΝ την αντιγραφή
            const sortedExercises = [...(block.program_exercises || [])].sort((a, b) => {
              const orderA = Number(a.exercise_order) || 0;
              const orderB = Number(b.exercise_order) || 0;
              console.log(`🚨 [DUPLICATE WEEK] Sorting exercises: ${orderA} vs ${orderB} for ${a.exercises?.name} vs ${b.exercises?.name}`);
              return orderA - orderB;
            });

            console.log(`🚨 [DUPLICATE WEEK] Sorted exercises for block ${block.name}:`);
            sortedExercises.forEach((ex, index) => {
              console.log(`🚨 [DUPLICATE WEEK]   ${index + 1}. ${ex.exercises?.name} (order: ${ex.exercise_order})`);
            });

            return {
              id: generateId(),
              name: block.name,
              block_order: block.block_order,
              training_type: block.training_type,
              workout_format: (block.workout_format as any) || undefined,
              workout_duration: block.workout_duration || '',
              block_sets: block.block_sets || 1,
              program_exercises: sortedExercises.map((exercise) => {
                const newExercise = {
                  id: generateId(),
                  exercise_id: exercise.exercise_id,
                  exercise_order: exercise.exercise_order,
                  sets: exercise.sets,
                  reps: exercise.reps,
                  reps_mode: exercise.reps_mode || 'reps',
                  kg: exercise.kg,
                  kg_mode: exercise.kg_mode || 'kg',
                  percentage_1rm: exercise.percentage_1rm,
                  velocity_ms: exercise.velocity_ms,
                  tempo: exercise.tempo,
                  rest: exercise.rest,
                  notes: exercise.notes || '',
                  exercises: exercise.exercises
                };
                
                console.log(`🚨 [DUPLICATE WEEK] Duplicated exercise: ${exercise.exercises?.name} with order: ${newExercise.exercise_order}`);
                return newExercise;
              })
            };
          })
        };
      })
    };

    console.log('🚨 [DUPLICATE WEEK] New week structure after duplication:', newWeekData);

    // ΚΡΙΤΙΚΗ ΔΙΟΡΘΩΣΗ: Χρησιμοποιούμε τα τρέχοντα weeks από το program state
    // και τα ενημερώνουμε άμεσα χωρίς να περιμένουμε το async update
    const currentWeeks = program.weeks || [];
    const updatedWeeks = [...currentWeeks, newWeekData];
    
    console.log('🚨 [DUPLICATE WEEK] Updating program with weeks count:', updatedWeeks.length);
    
    // Άμεση ενημέρωση του state
    updateProgram({ weeks: updatedWeeks });

    // Auto-save στη βάση αν υπάρχει το πρόγραμμα
    if (saveProgram && program.id) {
      console.log('💾 [DUPLICATE WEEK] Auto-saving to database...');
      try {
        await saveProgram({
          ...program,
          weeks: updatedWeeks
        });
        console.log('✅ [DUPLICATE WEEK] Auto-save completed');
      } catch (error) {
        console.error('❌ [DUPLICATE WEEK] Auto-save failed:', error);
      }
    }

    console.log('🚨 [DUPLICATE WEEK] Week duplication completed successfully');
  };

  const updateWeekName = (weekId: string, name: string) => {
    const updatedWeeks = (program.weeks || []).map(week =>
      week.id === weekId ? { ...week, name } : week
    );
    updateProgram({ weeks: updatedWeeks });
  };

  const pasteWeek = async (clipboardWeek: any) => {
    const newWeekData = {
      id: generateId(),
      name: `${clipboardWeek.name} (Επικόλληση)`,
      week_number: (program.weeks?.length || 0) + 1,
      program_days: (clipboardWeek.program_days || []).map((day: any, dayIdx: number) => ({
        id: generateId(),
        name: day.name,
        day_number: dayIdx + 1,
        estimated_duration_minutes: day.estimated_duration_minutes,
        is_test_day: day.is_test_day,
        test_types: day.test_types,
        is_competition_day: day.is_competition_day,
        program_blocks: (day.program_blocks || []).map((block: any) => ({
          id: generateId(),
          name: block.name,
          block_order: block.block_order,
          training_type: block.training_type,
          workout_format: block.workout_format,
          workout_duration: block.workout_duration,
          block_sets: block.block_sets || 1,
          program_exercises: (block.program_exercises || []).map((exercise: any, exIdx: number) => ({
            id: generateId(),
            exercise_id: exercise.exercise_id,
            exercise_order: exIdx + 1,
            sets: exercise.sets,
            reps: exercise.reps,
            reps_mode: exercise.reps_mode,
            kg: exercise.kg,
            kg_mode: exercise.kg_mode,
            percentage_1rm: exercise.percentage_1rm,
            velocity_ms: exercise.velocity_ms,
            tempo: exercise.tempo,
            rest: exercise.rest,
            notes: exercise.notes,
            exercises: exercise.exercises
          }))
        }))
      }))
    };

    const updatedWeeks = [...(program.weeks || []), newWeekData];
    updateProgram({ weeks: updatedWeeks });

    // Auto-save στη βάση αν υπάρχει το πρόγραμμα
    if (saveProgram && program.id) {
      console.log('💾 [PASTE WEEK] Auto-saving to database...');
      try {
        await saveProgram({
          ...program,
          weeks: updatedWeeks
        });
        console.log('✅ [PASTE WEEK] Auto-save completed');
      } catch (error) {
        console.error('❌ [PASTE WEEK] Auto-save failed:', error);
      }
    }
  };

  return {
    addWeek,
    removeWeek,
    duplicateWeek,
    updateWeekName,
    pasteWeek
  };
};
