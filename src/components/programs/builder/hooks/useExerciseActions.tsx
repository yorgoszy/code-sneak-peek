
import { ProgramStructure } from './useProgramBuilderState';

export const useExerciseActions = (
  program: ProgramStructure,
  updateProgram: (updates: Partial<ProgramStructure>) => void,
  generateId: () => string,
  exercises: any[],
  saveProgram?: (programData: any) => Promise<any>
) => {
  const findExerciseName = (exerciseId: string): string => {
    const exercise = exercises.find(ex => ex.id === exerciseId);
    return exercise ? exercise.name : 'Unknown Exercise';
  };

  const addExercise = (weekId: string, dayId: string, blockId: string, exerciseId: string) => {
    const updatedWeeks = (program.weeks || []).map(week => {
      if (week.id === weekId) {
        return {
          ...week,
          program_days: (week.program_days || []).map(day => {
            if (day.id === dayId) {
              return {
                ...day,
                program_blocks: (day.program_blocks || []).map(block => {
                  if (block.id === blockId) {
                    const newExercise = {
                      id: generateId(),
                      exercise_id: exerciseId,
                      sets: 1,
                      reps: '',
                      kg: '',
                      percentage_1rm: 0,
                      velocity_ms: 0,
                      tempo: '',
                      rest: '',
                      notes: '',
                      exercise_order: (block.program_exercises?.length || 0) + 1,
                      exercises: {
                        id: exerciseId,
                        name: findExerciseName(exerciseId),
                        description: ''
                      }
                    };
                    return {
                      ...block,
                      program_exercises: [...(block.program_exercises || []), newExercise]
                    };
                  }
                  return block;
                })
              };
            }
            return day;
          })
        };
      }
      return week;
    });
    updateProgram({ weeks: updatedWeeks });
  };

  const removeExercise = (weekId: string, dayId: string, blockId: string, exerciseId: string) => {
    const updatedWeeks = (program.weeks || []).map(week => {
      if (week.id === weekId) {
        return {
          ...week,
          program_days: (week.program_days || []).map(day => {
            if (day.id === dayId) {
              return {
                ...day,
                program_blocks: (day.program_blocks || []).map(block => {
                  if (block.id === blockId) {
                    return {
                      ...block,
                      program_exercises: (block.program_exercises || []).filter(exercise => exercise.id !== exerciseId)
                    };
                  }
                  return block;
                })
              };
            }
            return day;
          })
        };
      }
      return week;
    });
    updateProgram({ weeks: updatedWeeks });
  };

  const updateExercise = (weekId: string, dayId: string, blockId: string, exerciseId: string, field: string, value: any) => {
    const updatedWeeks = (program.weeks || []).map(week => {
      if (week.id === weekId) {
        return {
          ...week,
          program_days: (week.program_days || []).map(day => {
            if (day.id === dayId) {
              return {
                ...day,
                program_blocks: (day.program_blocks || []).map(block => {
                  if (block.id === blockId) {
                    return {
                      ...block,
                      program_exercises: (block.program_exercises || []).map(exercise =>
                        exercise.id === exerciseId ? { ...exercise, [field]: value } : exercise
                      )
                    };
                  }
                  return block;
                })
              };
            }
            return day;
          })
        };
      }
      return week;
    });
    updateProgram({ weeks: updatedWeeks });
  };

  const duplicateExercise = async (weekId: string, dayId: string, blockId: string, exerciseId: string) => {
    const updatedWeeks = (program.weeks || []).map(week => {
      if (week.id === weekId) {
        return {
          ...week,
          program_days: (week.program_days || []).map(day => {
            if (day.id === dayId) {
              return {
                ...day,
                program_blocks: (day.program_blocks || []).map(block => {
                  if (block.id === blockId) {
                    const exerciseToDuplicate = block.program_exercises?.find(exercise => exercise.id === exerciseId);
                    if (!exerciseToDuplicate) return block;

                    const newExercise = {
                      ...JSON.parse(JSON.stringify(exerciseToDuplicate)),
                      id: generateId(),
                      exercise_order: (block.program_exercises?.length || 0) + 1
                    };

                    return {
                      ...block,
                      program_exercises: [...(block.program_exercises || []), newExercise]
                    };
                  }
                  return block;
                })
              };
            }
            return day;
          })
        };
      }
      return week;
    });
    updateProgram({ weeks: updatedWeeks });

    // Αν το πρόγραμμα έχει ID και υπάρχει saveProgram function, αποθήκευσε αμέσως
    if (program.id && saveProgram) {
      try {
        console.log('💾 Auto-saving after exercise duplication...');
        await saveProgram({ ...program, weeks: updatedWeeks });
        console.log('✅ Exercise duplication saved to database');
      } catch (error) {
        console.error('❌ Failed to save exercise duplication:', error);
      }
    }
  };

  return {
    addExercise,
    removeExercise,
    updateExercise,
    duplicateExercise
  };
};
