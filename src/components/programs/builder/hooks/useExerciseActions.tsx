
import { ProgramStructure } from './useProgramBuilderState';
import { supabase } from '@/integrations/supabase/client';

// Σειρά προτεραιότητας για τα warm up exercises
const WARM_UP_ORDER = ['mobility', 'stability', 'activation', 'neural act'];
// Recovery relationship type
const RECOVERY_TYPE = 'recovery';

export const useExerciseActions = (
  program: ProgramStructure,
  updateProgram: (updates: Partial<ProgramStructure> | ((prev: ProgramStructure) => Partial<ProgramStructure>)) => void,
  generateId: () => string,
  exercises: any[],
  saveProgram?: (programData: any) => Promise<any>
) => {
  const findExerciseName = (exerciseId: string): string => {
    const exercise = exercises.find(ex => ex.id === exerciseId);
    return exercise ? exercise.name : 'Unknown Exercise';
  };

  // Fetch related exercises (mobility, stability, activation, neural act) for a given exercise
  const fetchExerciseRelationships = async (exerciseId: string) => {
    try {
      const { data, error } = await supabase
        .from('exercise_relationships')
        .select('relationship_type, related_exercise_id, order_index')
        .eq('exercise_id', exerciseId)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Error fetching exercise relationships:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in fetchExerciseRelationships:', error);
      return [];
    }
  };

  const addExercise = async (weekId: string, dayId: string, blockId: string, exerciseId: string) => {
    console.log('🔵 addExercise called with:', { weekId, dayId, blockId, exerciseId });
    
    // Fetch relationships asynchronously
    const relationships = await fetchExerciseRelationships(exerciseId);
    console.log('🔗 Found relationships:', relationships);

    // Use functional updater to avoid stale state
    updateProgram((prev) => {
      const updatedWeeks = (prev.weeks || []).map(week => {
        if (week.id === weekId) {
          return {
            ...week,
            program_days: (week.program_days || []).map(day => {
              if (day.id === dayId) {
                let updatedBlocks = [...(day.program_blocks || [])];

                // Προσθήκη κύριας άσκησης στο στοχευμένο block
                updatedBlocks = updatedBlocks.map(block => {
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
                    
                    console.log('➕ Adding main exercise to block:', block.name);
                    
                    return {
                      ...block,
                      program_exercises: [...(block.program_exercises || []), newExercise]
                    };
                  }
                  return block;
                });

                // Προσθήκη σχετικών ασκήσεων στο warm up block
                const warmUpRelationships = relationships.filter(rel => WARM_UP_ORDER.includes(rel.relationship_type));
                const recoveryRelationships = relationships.filter(rel => rel.relationship_type === RECOVERY_TYPE);

                if (warmUpRelationships.length > 0) {
                  updatedBlocks = updatedBlocks.map(block => {
                    if (block.training_type === 'warm up') {
                      const existingExerciseIds = new Set(
                        (block.program_exercises || []).map(ex => ex.exercise_id)
                      );

                      const sortedRelationships = [...warmUpRelationships].sort((a, b) => {
                        const orderA = WARM_UP_ORDER.indexOf(a.relationship_type);
                        const orderB = WARM_UP_ORDER.indexOf(b.relationship_type);
                        return (orderA === -1 ? 999 : orderA) - (orderB === -1 ? 999 : orderB);
                      });

                      const newRelationships = sortedRelationships.filter(
                        rel => !existingExerciseIds.has(rel.related_exercise_id)
                      );

                      if (newRelationships.length === 0) return block;

                      const newWarmUpExercises = newRelationships.map((rel, index) => ({
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
                      
                      return {
                        ...block,
                        program_exercises: [...(block.program_exercises || []), ...newWarmUpExercises]
                      };
                    }
                    return block;
                  });
                }

                if (recoveryRelationships.length > 0) {
                  updatedBlocks = updatedBlocks.map(block => {
                    if (block.training_type === 'recovery') {
                      const existingExerciseIds = new Set(
                        (block.program_exercises || []).map(ex => ex.exercise_id)
                      );

                      const newRecoveryRelationships = recoveryRelationships.filter(
                        rel => !existingExerciseIds.has(rel.related_exercise_id)
                      );

                      if (newRecoveryRelationships.length === 0) return block;

                      const newRecoveryExercises = newRecoveryRelationships.map((rel, index) => ({
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
                      
                      return {
                        ...block,
                        program_exercises: [...(block.program_exercises || []), ...newRecoveryExercises]
                      };
                    }
                    return block;
                  });
                }

                return {
                  ...day,
                  program_blocks: updatedBlocks
                };
              }
              return day;
            })
          };
        }
        return week;
      });
      
      return { weeks: updatedWeeks };
    });
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
    updateProgram((prev) => {
      const updatedWeeks = (prev.weeks || []).map(week => {
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
      return { weeks: updatedWeeks };
    });
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
