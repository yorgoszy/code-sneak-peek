
import { ProgramStructure } from './useProgramBuilderState';
import { supabase } from '@/integrations/supabase/client';

// Σειρά προτεραιότητας για τα warm up exercises
const WARM_UP_ORDER = ['mobility', 'stability', 'activation', 'neural act'];

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

    const updatedWeeks = (program.weeks || []).map(week => {
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
              if (relationships.length > 0) {
                updatedBlocks = updatedBlocks.map(block => {
                  // Βρίσκουμε το warm up block
                  if (block.training_type === 'warm up') {
                    // Ταξινομούμε τα relationships με βάση τη σειρά WARM_UP_ORDER
                    const sortedRelationships = [...relationships].sort((a, b) => {
                      const orderA = WARM_UP_ORDER.indexOf(a.relationship_type);
                      const orderB = WARM_UP_ORDER.indexOf(b.relationship_type);
                      // Αν δεν βρεθεί στη λίστα, βάζουμε στο τέλος
                      const finalOrderA = orderA === -1 ? 999 : orderA;
                      const finalOrderB = orderB === -1 ? 999 : orderB;
                      return finalOrderA - finalOrderB;
                    });

                    const newWarmUpExercises = sortedRelationships.map((rel, index) => ({
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
                    
                    console.log('➕ Adding warm up exercises to warm up block:', newWarmUpExercises.length);
                    console.log('📋 Order:', sortedRelationships.map(r => r.relationship_type));
                    
                    return {
                      ...block,
                      program_exercises: [...(block.program_exercises || []), ...newWarmUpExercises]
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
