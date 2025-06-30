
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

    // 🚨 ΚΡΙΤΙΚΗ ΔΙΟΡΘΩΣΗ: Χειροκίνητη δημιουργία αντιγράφου χωρίς JSON.parse
    // για να διατηρήσουμε τη σύνδεση με το reactive state
    const newWeek = {
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
                  exercise_order: exercise.exercise_order, // 🚨 ΚΡΙΤΙΚΟ: Διατηρούμε το αρχικό exercise_order
                  sets: exercise.sets,
                  reps: exercise.reps,
                  kg: exercise.kg,
                  tempo: exercise.tempo,
                  rest: exercise.rest,
                  notes: exercise.notes || '',
                  exercises: exercise.exercises // Διατηρούμε την αναφορά στην άσκηση
                };
                
                console.log(`🚨 [DUPLICATE WEEK] Duplicated exercise: ${exercise.exercises?.name} with order: ${newExercise.exercise_order}`);
                return newExercise;
              })
            };
          })
        };
      })
    };

    console.log('🚨 [DUPLICATE WEEK] New week structure after duplication:', newWeek);

    // Έλεγχος ότι η σειρά διατηρήθηκε
    newWeek.program_days.forEach((day, dayIndex) => {
      console.log(`🚨 [DUPLICATE WEEK FINAL CHECK] Day ${dayIndex + 1}: ${day.name}`);
      day.program_blocks.forEach((block, blockIndex) => {
        console.log(`🚨 [DUPLICATE WEEK FINAL CHECK] Block ${blockIndex + 1}: ${block.name}`);
        const exercises = block.program_exercises || [];
        console.log(`🚨 [DUPLICATE WEEK FINAL CHECK] Final exercise order in duplicated block:`);
        exercises.forEach((ex, exIndex) => {
          console.log(`🚨 [DUPLICATE WEEK FINAL CHECK]   ${exIndex + 1}. ${ex.exercises?.name} (order: ${ex.exercise_order})`);
        });
      });
    });

    const updatedWeeks = [...(program.weeks || []), newWeek];
    updateProgram({ weeks: updatedWeeks });
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
