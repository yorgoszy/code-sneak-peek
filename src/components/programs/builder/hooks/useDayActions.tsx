
import { ProgramStructure } from './useProgramBuilderState';

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
        // Δημιουργούμε τα 6 προκαθορισμένα blocks με τη σωστή σειρά
        const defaultBlocks = [
          {
            id: generateId(),
            name: 'warm up',
            training_type: 'warm up' as const,
            block_order: 1,
            program_exercises: []
          },
          {
            id: generateId(),
            name: 'str',
            training_type: 'str' as const,
            block_order: 2,
            program_exercises: []
          },
          {
            id: generateId(),
            name: 'end',
            training_type: 'end' as const,
            block_order: 3,
            program_exercises: []
          },
          {
            id: generateId(),
            name: 'rotational',
            training_type: 'rotational' as const,
            block_order: 4,
            program_exercises: []
          },
          {
            id: generateId(),
            name: 'accessory',
            training_type: 'accessory' as const,
            block_order: 5,
            program_exercises: []
          },
          {
            id: generateId(),
            name: 'recovery',
            training_type: 'recovery' as const,
            block_order: 6,
            program_exercises: []
          }
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
            ...block,
            id: generateId(),
            program_exercises: block.program_exercises.map(exercise => ({
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
          program_days: (week.program_days || []).map(day =>
            day.id === dayId ? { ...day, is_test_day: isTestDay, test_types: testTypes } : day
          )
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
          program_days: (week.program_days || []).map(day =>
            day.id === dayId ? { ...day, is_competition_day: isCompetitionDay } : day
          )
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
