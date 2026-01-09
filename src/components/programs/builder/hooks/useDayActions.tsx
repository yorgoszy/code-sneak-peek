
import { ProgramStructure, Block, ProgramExercise } from './useProgramBuilderState';
import { toast } from 'sonner';
import { fetchAthleteWarmUpExercises, WarmUpExercise } from './useAthleteWarmUpExercises';

export const useDayActions = (
  program: ProgramStructure,
  updateProgram: (updates: Partial<ProgramStructure>) => void,
  generateId: () => string,
  saveProgram?: (programData: any) => Promise<any>,
  exercises?: any[]
) => {
  // Helper function to create warm up exercises from athlete's functional test data
  const createWarmUpExercisesFromAthleteData = async (
    userId: string, 
    bodyFocus?: 'upper' | 'lower'
  ): Promise<ProgramExercise[]> => {
    if (!userId) return [];
    
    try {
      const warmUpExercises = await fetchAthleteWarmUpExercises(userId);
      
      // Filter by body region if specified
      const filteredExercises = bodyFocus 
        ? warmUpExercises.filter(ex => ex.body_region === bodyFocus)
        : warmUpExercises;
      
      return filteredExercises.map((warmUp, index) => ({
        id: generateId(),
        exercise_id: warmUp.exercise_id,
        sets: 1,
        reps: '',
        reps_mode: 'reps' as const,
        kg: '',
        kg_mode: 'kg' as const,
        percentage_1rm: 0,
        velocity_ms: 0,
        tempo: '',
        rest: '',
        notes: warmUp.exercise_type === 'stretching' ? 'Stretching' : 'Strengthening',
        exercise_order: index + 1,
        exercises: exercises?.find(ex => ex.id === warmUp.exercise_id) || {
          id: warmUp.exercise_id,
          name: warmUp.exercise_name,
          description: ''
        }
      }));
    } catch (error) {
      console.error('Error creating warm up exercises:', error);
      return [];
    }
  };

  const addDay = async (weekId: string) => {
    console.log('🔵 addDay called with weekId:', weekId);
    
    // Get selected user ID for warm up exercises
    const selectedUserId = program.user_id || (program.user_ids && program.user_ids.length > 0 ? program.user_ids[0] : '');
    
    // Fetch athlete warm up exercises
    let warmUpExercises: ProgramExercise[] = [];
    if (selectedUserId) {
      console.log('🏋️ Fetching warm up exercises for athlete:', selectedUserId);
      warmUpExercises = await createWarmUpExercisesFromAthleteData(selectedUserId);
      console.log('🏋️ Found warm up exercises:', warmUpExercises.length);
    }
    
    const updatedWeeks = (program.weeks || []).map(week => {
      if (week.id === weekId) {
        // Δημιουργούμε τα 7 προκαθορισμένα blocks με τη σωστή σειρά
        const defaultBlocks = [
          { id: generateId(), name: 'warm up', training_type: 'warm up' as Block['training_type'], block_order: 1, block_sets: 1, program_exercises: warmUpExercises },
          { id: generateId(), name: 'power', training_type: 'power' as Block['training_type'], block_order: 2, block_sets: 1, program_exercises: [] },
          { id: generateId(), name: 'str', training_type: 'str' as Block['training_type'], block_order: 3, block_sets: 1, program_exercises: [] },
          { id: generateId(), name: 'end', training_type: 'end' as Block['training_type'], block_order: 4, block_sets: 1, program_exercises: [] },
          { id: generateId(), name: 'rotational', training_type: 'rotational' as Block['training_type'], block_order: 5, block_sets: 1, program_exercises: [] },
          { id: generateId(), name: 'accessory', training_type: 'accessory' as Block['training_type'], block_order: 6, block_sets: 1, program_exercises: [] },
          { id: generateId(), name: 'recovery', training_type: 'recovery' as Block['training_type'], block_order: 7, block_sets: 1, program_exercises: [] }
        ];

        const newDay = {
          id: generateId(),
          name: `Day ${(week.program_days?.length || 0) + 1}`,
          day_number: (week.program_days?.length || 0) + 1,
          program_blocks: defaultBlocks
        };
        
        console.log('✅ Created new day with default blocks, warm up exercises:', warmUpExercises.length);
        
        return {
          ...week,
          program_days: [...(week.program_days || []), newDay]
        };
      }
      return week;
    });
    console.log('🔵 Calling updateProgram with updated weeks');
    updateProgram({ weeks: updatedWeeks });
  };

  const removeDay = (weekId: string, dayId: string) => {
    const updatedWeeks = (program.weeks || []).map(week => {
      if (week.id === weekId) {
        return {
          ...week,
          program_days: (week.program_days || []).filter(day => day.id !== dayId)
        };
      }
      return week;
    });
    updateProgram({ weeks: updatedWeeks });
  };

  const duplicateDay = (weekId: string, dayId: string) => {
    const updatedWeeks = (program.weeks || []).map(week => {
      if (week.id === weekId) {
        const dayToDuplicate = week.program_days?.find(day => day.id === dayId);
        if (!dayToDuplicate) return week;

        const newDay = {
          ...JSON.parse(JSON.stringify(dayToDuplicate)),
          id: generateId(),
          name: `${dayToDuplicate.name}c`,
          day_number: (week.program_days?.length || 0) + 1,
          program_blocks: dayToDuplicate.program_blocks.map(block => ({
            id: generateId(),
            name: block.name,
            block_order: block.block_order,
            training_type: block.training_type,
            workout_format: block.workout_format || '',
            workout_duration: block.workout_duration || '',
            block_sets: block.block_sets || 1,
            program_exercises: (block.program_exercises || []).map(exercise => ({
              ...exercise,
              id: generateId()
            }))
          }))
        };

        return {
          ...week,
          program_days: [...(week.program_days || []), newDay]
        };
      }
      return week;
    });
    updateProgram({ weeks: updatedWeeks });
  };

  const updateDayName = (weekId: string, dayId: string, name: string) => {
    const updatedWeeks = (program.weeks || []).map(week => {
      if (week.id === weekId) {
        return {
          ...week,
          program_days: (week.program_days || []).map(day =>
            day.id === dayId ? { ...day, name } : day
          )
        };
      }
      return week;
    });
    updateProgram({ weeks: updatedWeeks });
  };

  const updateDayTestDay = (weekId: string, dayId: string, isTestDay: boolean, testTypes: string[]) => {
    const updatedWeeks = (program.weeks || []).map(week => {
      if (week.id === weekId) {
        return {
          ...week,
          program_days: (week.program_days || []).map(day => {
            if (day.id !== dayId) return day;

            const original = day.original_day_name ?? day.name;

            // Enable: save original name (once) + set label name
            if (isTestDay) {
              return {
                ...day,
                original_day_name: original,
                name: 'Ημέρα Τεστ',
                is_test_day: true,
                test_types: testTypes,
                // mutual exclusive
                is_competition_day: false
              };
            }

            // Disable: restore original name
            return {
              ...day,
              name: day.original_day_name ?? day.name,
              original_day_name: undefined,
              is_test_day: false,
              test_types: testTypes
            };
          })
        };
      }
      return week;
    });
    updateProgram({ weeks: updatedWeeks });
  };

  const updateDayCompetitionDay = (weekId: string, dayId: string, isCompetitionDay: boolean) => {
    const updatedWeeks = (program.weeks || []).map(week => {
      if (week.id === weekId) {
        return {
          ...week,
          program_days: (week.program_days || []).map(day => {
            if (day.id !== dayId) return day;

            const original = day.original_day_name ?? day.name;

            // Enable: save original name (once) + set label name
            if (isCompetitionDay) {
              return {
                ...day,
                original_day_name: original,
                name: 'Ημέρα Αγώνα',
                is_competition_day: true,
                // mutual exclusive
                is_test_day: false,
                test_types: []
              };
            }

            // Disable: restore original name
            return {
              ...day,
              name: day.original_day_name ?? day.name,
              original_day_name: undefined,
              is_competition_day: false
            };
          })
        };
      }
      return week;
    });
    updateProgram({ weeks: updatedWeeks });
  };

  // Update day body focus and refresh warm up exercises
  const updateDayBodyFocus = async (weekId: string, dayId: string, bodyFocus: 'upper' | 'lower' | undefined) => {
    const selectedUserId = program.user_id || (program.user_ids && program.user_ids.length > 0 ? program.user_ids[0] : '');
    
    // Fetch new warm up exercises based on body focus
    let warmUpExercises: ProgramExercise[] = [];
    if (selectedUserId && bodyFocus) {
      console.log('🏋️ Fetching warm up exercises for body focus:', bodyFocus);
      warmUpExercises = await createWarmUpExercisesFromAthleteData(selectedUserId, bodyFocus);
      console.log('🏋️ Found filtered warm up exercises:', warmUpExercises.length);
    }
    
    const updatedWeeks = (program.weeks || []).map(week => {
      if (week.id === weekId) {
        return {
          ...week,
          program_days: (week.program_days || []).map(day => {
            if (day.id !== dayId) return day;
            
            // Update body_focus and warm up block exercises
            const updatedBlocks = day.program_blocks.map(block => {
              if (block.training_type === 'warm up' || block.name === 'warm up') {
                return {
                  ...block,
                  program_exercises: warmUpExercises
                };
              }
              return block;
            });
            
            return {
              ...day,
              body_focus: bodyFocus,
              program_blocks: updatedBlocks
            };
          })
        };
      }
      return week;
    });
    
    updateProgram({ weeks: updatedWeeks });
    
    if (bodyFocus) {
      toast.success(`Ενημερώθηκε το warm up για ${bodyFocus === 'upper' ? 'άνω κορμό' : 'κάτω κορμό'}`);
    }
  };

  // Paste day - αντικαθιστά την υπάρχουσα ημέρα
  const pasteDay = (weekId: string, dayId: string, clipboardDay: any) => {
    const updatedWeeks = (program.weeks || []).map(week => {
      if (week.id === weekId) {
        return {
          ...week,
          program_days: (week.program_days || []).map(day => {
            if (day.id === dayId) {
              return {
                ...day,
                name: clipboardDay.name,
                is_test_day: clipboardDay.is_test_day,
                test_types: clipboardDay.test_types,
                is_competition_day: clipboardDay.is_competition_day,
                body_focus: clipboardDay.body_focus,
                program_blocks: (clipboardDay.program_blocks || []).map((block: any, blockIdx: number) => ({
                  id: generateId(),
                  name: block.name,
                  block_order: blockIdx + 1,
                  training_type: block.training_type,
                  workout_format: block.workout_format,
                  workout_duration: block.workout_duration,
                  block_sets: block.block_sets || 1,
                  program_exercises: (block.program_exercises || []).map((exercise: any, exIdx: number) => ({
                    ...exercise,
                    id: generateId(),
                    exercise_order: exIdx + 1
                  }))
                }))
              };
            }
            return day;
          })
        };
      }
      return week;
    });
    updateProgram({ weeks: updatedWeeks });
    toast.success('Ημέρα επικολλήθηκε επιτυχώς');
  };

  return {
    addDay,
    removeDay,
    duplicateDay,
    updateDayName,
    updateDayTestDay,
    updateDayCompetitionDay,
    updateDayBodyFocus,
    pasteDay
  };
};
