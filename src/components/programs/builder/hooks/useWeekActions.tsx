
import { ProgramStructure } from './useProgramBuilderState';

export const useWeekActions = (
  program: ProgramStructure,
  updateProgram: (updates: Partial<ProgramStructure>) => void,
  generateId: () => string
) => {
  const addWeek = () => {
    const newWeek = {
      id: generateId(),
      name: `Εβδομάδα ${(program.weeks?.length || 0) + 1}`,
      week_number: (program.weeks?.length || 0) + 1,
      program_days: []
    };

    const updatedWeeks = [...(program.weeks || []), newWeek];
    updateProgram({ weeks: updatedWeeks });
  };

  const removeWeek = (weekId: string) => {
    const updatedWeeks = (program.weeks || []).filter(week => week.id !== weekId);
    updateProgram({ weeks: updatedWeeks });
  };

  const duplicateWeek = (weekId: string) => {
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
              program_exercises: sortedExercises.map((exercise) => {
                const newExercise = {
                  id: generateId(),
                  exercise_id: exercise.exercise_id,
                  exercise_order: exercise.exercise_order,
                  sets: exercise.sets,
                  reps: exercise.reps,
                  kg: exercise.kg,
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

    console.log('🚨 [DUPLICATE WEEK] Week duplication completed successfully');
  };

  const updateWeekName = (weekId: string, name: string) => {
    const updatedWeeks = (program.weeks || []).map(week =>
      week.id === weekId ? { ...week, name } : week
    );
    updateProgram({ weeks: updatedWeeks });
  };

  return {
    addWeek,
    removeWeek,
    duplicateWeek,
    updateWeekName
  };
};
