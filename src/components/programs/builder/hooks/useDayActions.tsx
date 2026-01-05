
import { ProgramStructure, Block } from './useProgramBuilderState';

export const useDayActions = (
  program: ProgramStructure,
  updateProgram: (updates: Partial<ProgramStructure>) => void,
  generateId: () => string,
  saveProgram?: (programData: any) => Promise<any>
) => {
  const addDay = (weekId: string) => {
    console.log('🔵 addDay called with weekId:', weekId);
    const updatedWeeks = (program.weeks || []).map(week => {
      if (week.id === weekId) {
        // Δημιουργούμε τα 7 προκαθορισμένα blocks με τη σωστή σειρά
        const defaultBlocks = [
          { id: generateId(), name: 'warm up', training_type: 'warm up' as Block['training_type'], block_order: 1, block_sets: 1, program_exercises: [] },
          { id: generateId(), name: 'power', training_type: 'power' as Block['training_type'], block_order: 2, block_sets: 1, program_exercises: [] },
          { id: generateId(), name: 'str', training_type: 'str' as Block['training_type'], block_order: 3, block_sets: 1, program_exercises: [] },
          { id: generateId(), name: 'end', training_type: 'end' as Block['training_type'], block_order: 4, block_sets: 1, program_exercises: [] },
          { id: generateId(), name: 'rotational', training_type: 'rotational' as Block['training_type'], block_order: 5, block_sets: 1, program_exercises: [] },
          { id: generateId(), name: 'accessory', training_type: 'accessory' as Block['training_type'], block_order: 6, block_sets: 1, program_exercises: [] },
          { id: generateId(), name: 'recovery', training_type: 'recovery' as Block['training_type'], block_order: 7, block_sets: 1, program_exercises: [] }
        ];

        const newDay = {
          id: generateId(),
          name: `Ημέρα ${(week.program_days?.length || 0) + 1}`,
          day_number: (week.program_days?.length || 0) + 1,
          program_blocks: defaultBlocks
        };
        
        console.log('✅ Created new day with 6 default blocks:', newDay);
        
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
          name: `${dayToDuplicate.name} (Αντίγραφο)`,
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

  return {
    addDay,
    removeDay,
    duplicateDay,
    updateDayName,
    updateDayTestDay,
    updateDayCompetitionDay
  };
};
