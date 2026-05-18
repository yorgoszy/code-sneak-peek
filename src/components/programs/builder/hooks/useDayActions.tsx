
import { ProgramStructure, Block, ProgramExercise } from './useProgramBuilderState';
import { toast } from 'sonner';
import { fetchAthleteWarmUpExercises, getCachedWarmUpExercises, WarmUpExercise } from './useAthleteWarmUpExercises';
import type { EffortType } from '../../types';

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

  const addDay = (weekId: string) => {
    // Create day immediately without waiting for warm-up exercises
    const updatedWeeks = (program.weeks || []).map(week => {
      if (week.id === weekId) {
        // Δημιουργούμε τα 7 προκαθορισμένα blocks με τη σωστή σειρά
        const defaultBlocks: Block[] = [
          { id: generateId(), name: 'warm up', training_type: 'warm up', block_order: 1, block_sets: 1, program_exercises: [] },
          { id: generateId(), name: 'pwr', training_type: 'pwr', block_order: 2, block_sets: 1, program_exercises: [] },
          { id: generateId(), name: 'str', training_type: 'str', block_order: 3, block_sets: 1, program_exercises: [] },
          { id: generateId(), name: 'end', training_type: 'end', block_order: 4, block_sets: 1, program_exercises: [] },
          { id: generateId(), name: 'rot', training_type: 'rotational', block_order: 5, block_sets: 1, program_exercises: [] },
          { id: generateId(), name: 'acc', training_type: 'accessory', block_order: 6, block_sets: 1, program_exercises: [] },
          { id: generateId(), name: 'rec', training_type: 'recovery', block_order: 7, block_sets: 1, program_exercises: [] }
        ];

        const newDay = {
          id: generateId(),
          name: `Day ${(week.program_days?.length || 0) + 1}`,
          day_number: (week.program_days?.length || 0) + 1,
          program_blocks: defaultBlocks
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
                name: 'Test',
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
                name: 'Fight',
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

  const updateDayEsdRecovery = (weekId: string, dayId: string, isEsdDay: boolean, isRecoveryDay: boolean) => {
    const updatedWeeks = (program.weeks || []).map(week => {
      if (week.id === weekId) {
        return {
          ...week,
          program_days: (week.program_days || []).map(day => {
            if (day.id !== dayId) return day;
            return {
              ...day,
              is_esd_day: isEsdDay,
              is_recovery_day: isRecoveryDay
            };
          })
        };
      }
      return week;
    });
    updateProgram({ weeks: updatedWeeks });
  };

  // Update day effort (upper/lower) - cycles: none -> DE -> ME -> none
  // Also updates warm-up exercises based on selected body parts
  const updateDayEffort = async (weekId: string, dayId: string, bodyPart: 'upper' | 'lower', effort: EffortType) => {
    // Collect ALL selected user IDs (multi mode) or single user
    const allUserIds: string[] = program.is_multiple_assignment && program.user_ids?.length
      ? [...program.user_ids]
      : (program.user_id ? [program.user_id] : []);

    // Get current day to calculate new effort values
    const currentWeek = program.weeks?.find(w => w.id === weekId);
    const currentDay = currentWeek?.program_days?.find(d => d.id === dayId);

    const newUpperEffort = bodyPart === 'upper' ? effort : (currentDay?.upper_effort || 'none');
    const newLowerEffort = bodyPart === 'lower' ? effort : (currentDay?.lower_effort || 'none');

    const includeUpper = newUpperEffort !== 'none';
    const includeLower = newLowerEffort !== 'none';

    // Build per-user warm-up exercise map
    const byUser: Record<string, ProgramExercise[]> = {};

    if (allUserIds.length > 0 && (includeUpper || includeLower)) {
      await Promise.all(allUserIds.map(async (uid) => {
        let allExercises = getCachedWarmUpExercises(uid);
        if (!allExercises) {
          allExercises = await fetchAthleteWarmUpExercises(uid);
        }
        const filtered = allExercises.filter(ex => {
          if (includeUpper && ex.body_region === 'upper') return true;
          if (includeLower && ex.body_region === 'lower') return true;
          return false;
        });
        byUser[uid] = filtered.map((warmUp, index) => ({
          id: generateId(),
          exercise_id: warmUp.exercise_id,
          exercise_order: index + 1,
          sets: 1,
          reps: warmUp.exercise_type === 'stretching' ? '30' : '10',
          reps_mode: warmUp.exercise_type === 'stretching' ? 'time' as const : 'reps' as const,
          kg: '',
          kg_mode: 'kg' as const,
          tempo: '',
          rest: '',
          notes: `${warmUp.muscle_name} - ${warmUp.exercise_type === 'stretching' ? 'Διάταση' : 'Ενδυνάμωση'}`,
          exercises: exercises?.find(ex => ex.id === warmUp.exercise_id)
        }));
      }));
    }

    // Default program_exercises (first user) - kept for legacy/single mode compatibility
    const defaultExercises: ProgramExercise[] = allUserIds.length > 0 && byUser[allUserIds[0]]
      ? byUser[allUserIds[0]]
      : [];

    console.log('🏋️ Per-user warm-up exercises:', Object.fromEntries(
      Object.entries(byUser).map(([k, v]) => [k, v.length])
    ));

    const updatedWeeks = (program.weeks || []).map(week => {
      if (week.id === weekId) {
        return {
          ...week,
          program_days: (week.program_days || []).map(day => {
            if (day.id !== dayId) return day;

            const updatedBlocks = day.program_blocks.map(block => {
              if (block.training_type === 'warm up') {
                return {
                  ...block,
                  program_exercises: defaultExercises,
                  program_exercises_by_user: byUser
                };
              }
              return block;
            });

            return {
              ...day,
              upper_effort: newUpperEffort,
              lower_effort: newLowerEffort,
              program_blocks: updatedBlocks
            };
          })
        };
      }
      return week;
    });

    updateProgram({ weeks: updatedWeeks });

    if (effort !== 'none') {
      const bodyLabel = bodyPart === 'upper' ? 'Άνω Κορμός' : 'Κάτω Κορμός';
      toast.success(`${bodyLabel}: ${effort}`);
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
                is_esd_day: clipboardDay.is_esd_day,
                is_recovery_day: clipboardDay.is_recovery_day,
                upper_effort: clipboardDay.upper_effort,
                lower_effort: clipboardDay.lower_effort,
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
    updateDayEsdRecovery,
    updateDayEffort,
    pasteDay
  };
};
