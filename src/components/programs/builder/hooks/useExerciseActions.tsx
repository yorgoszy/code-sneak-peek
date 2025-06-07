
import { ProgramStructure } from './useProgramBuilderState';

export const useExerciseActions = (
  program: ProgramStructure,
  updateProgram: (updates: Partial<ProgramStructure>) => void,
  generateId: () => string,
  exercises: any[]
) => {
  const addExercise = (weekId: string, dayId: string, blockId: string, exerciseId: string) => {
    const selectedExercise = exercises.find(ex => ex.id === exerciseId);
    
    const updatedWeeks = (program.weeks || []).map(week => {
      if (week.id === weekId) {
        return {
          ...week,
          days: (week.days || []).map(day => {
            if (day.id === dayId) {
              return {
                ...day,
                program_blocks: (day.program_blocks || []).map(block => {
                  if (block.id === blockId) {
                    const newExercise = {
                      id: generateId(),
                      exercise_id: exerciseId,
                      exercise_name: selectedExercise?.name || '',
                      sets: 0,
                      reps: '',
                      percentage_1rm: 0,
                      kg: '',
                      velocity_ms: '',
                      tempo: '',
                      rest: '',
                      exercise_order: (block.exercises?.length || 0) + 1
                    };
                    
                    return {
                      ...block,
                      exercises: [...(block.exercises || []), newExercise]
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
          days: (week.days || []).map(day => {
            if (day.id === dayId) {
              return {
                ...day,
                program_blocks: (day.program_blocks || []).map(block => {
                  if (block.id === blockId) {
                    return {
                      ...block,
                      exercises: (block.exercises || []).filter(exercise => exercise.id !== exerciseId)
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
          days: (week.days || []).map(day => {
            if (day.id === dayId) {
              return {
                ...day,
                program_blocks: (day.program_blocks || []).map(block => {
                  if (block.id === blockId) {
                    return {
                      ...block,
                      exercises: (block.exercises || []).map(exercise =>
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

  const duplicateExercise = (weekId: string, dayId: string, blockId: string, exerciseId: string) => {
    const updatedWeeks = (program.weeks || []).map(week => {
      if (week.id === weekId) {
        return {
          ...week,
          days: (week.days || []).map(day => {
            if (day.id === dayId) {
              return {
                ...day,
                program_blocks: (day.program_blocks || []).map(block => {
                  if (block.id === blockId) {
                    const exerciseToDuplicate = block.exercises?.find(exercise => exercise.id === exerciseId);
                    if (!exerciseToDuplicate) return block;

                    const newExercise = {
                      ...exerciseToDuplicate,
                      id: generateId(),
                      exercise_order: (block.exercises?.length || 0) + 1
                    };

                    return {
                      ...block,
                      exercises: [...(block.exercises || []), newExercise]
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

  return {
    addExercise,
    removeExercise,
    updateExercise,
    duplicateExercise
  };
};
