
import { ProgramStructure } from './useProgramBuilderState';
import { supabase } from '@/integrations/supabase/client';

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
    // Fetch relationships asynchronously and apply them
    supabase
      .from('exercise_relationships')
      .select('relationship_type, related_exercise_id, order_index')
      .eq('exercise_id', exerciseId)
      .order('order_index', { ascending: true })
      .then(({ data: relationships, error }) => {
        if (error) {
          console.error('Error fetching exercise relationships:', error);
          return;
        }

        const updatedWeeks = (program.weeks || []).map(week => {
          if (week.id === weekId) {
            return {
              ...week,
              program_days: (week.program_days || []).map(day => {
                if (day.id === dayId) {
                  return {
                    ...day,
                    program_blocks: (day.program_blocks || []).map(block => {
                      // Add exercise to the target block
                      if (block.id === blockId) {
                        const newExercise = {
                          id: generateId(),
                          exercise_id: exerciseId,
                          sets: 1,
                          reps: '',
                          reps_mode: 'reps' as const,
                          kg: '',
                          kg_mode: 'kg' as const,
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

                      if (!relationships || relationships.length === 0) return block;

                      // Auto-add mobility exercises to mobility blocks
                      const mobilityRelationships = relationships.filter(r => r.relationship_type === 'mobility');
                      if (block.training_type === 'mobility' && mobilityRelationships.length > 0) {
                        const mobilityExercises = mobilityRelationships.map((rel, index) => ({
                          id: generateId(),
                          exercise_id: rel.related_exercise_id,
                          sets: 1,
                          reps: '',
                          reps_mode: 'reps' as const,
                          kg: '',
                          kg_mode: 'kg' as const,
                          percentage_1rm: 0,
                          velocity_ms: 0,
                          tempo: '',
                          rest: '',
                          notes: '',
                          exercise_order: (block.program_exercises?.length || 0) + index + 1,
                          exercises: {
                            id: rel.related_exercise_id,
                            name: findExerciseName(rel.related_exercise_id),
                            description: ''
                          }
                        }));

                        const existingIds = (block.program_exercises || []).map(e => e.exercise_id);
                        const newMobilityExercises = mobilityExercises.filter(
                          e => !existingIds.includes(e.exercise_id)
                        );

                        if (newMobilityExercises.length > 0) {
                          return {
                            ...block,
                            program_exercises: [...(block.program_exercises || []), ...newMobilityExercises]
                          };
                        }
                      }

                      // Auto-add stability exercises to stability blocks
                      const stabilityRelationships = relationships.filter(r => r.relationship_type === 'stability');
                      if (block.training_type === 'stability' && stabilityRelationships.length > 0) {
                        const stabilityExercises = stabilityRelationships.map((rel, index) => ({
                          id: generateId(),
                          exercise_id: rel.related_exercise_id,
                          sets: 1,
                          reps: '',
                          reps_mode: 'reps' as const,
                          kg: '',
                          kg_mode: 'kg' as const,
                          percentage_1rm: 0,
                          velocity_ms: 0,
                          tempo: '',
                          rest: '',
                          notes: '',
                          exercise_order: (block.program_exercises?.length || 0) + index + 1,
                          exercises: {
                            id: rel.related_exercise_id,
                            name: findExerciseName(rel.related_exercise_id),
                            description: ''
                          }
                        }));

                        const existingIds = (block.program_exercises || []).map(e => e.exercise_id);
                        const newStabilityExercises = stabilityExercises.filter(
                          e => !existingIds.includes(e.exercise_id)
                        );

                        if (newStabilityExercises.length > 0) {
                          return {
                            ...block,
                            program_exercises: [...(block.program_exercises || []), ...newStabilityExercises]
                          };
                        }
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
      });

    // Immediately add the main exercise without waiting for relationships
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
                      reps_mode: 'reps' as const,
                      kg: '',
                      kg_mode: 'kg' as const,
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
  };

  return {
    addExercise,
    removeExercise,
    updateExercise,
    duplicateExercise
  };
};
