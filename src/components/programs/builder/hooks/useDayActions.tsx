
import { ProgramStructure } from './useProgramBuilderState';

export const useDayActions = (
  program: ProgramStructure,
  updateProgram: (updates: Partial<ProgramStructure>) => void,
  generateId: () => string,
  saveProgram?: (programData: any) => Promise<any>
) => {
  const addDay = (weekId: string) => {
    const updatedWeeks = (program.weeks || []).map(week => {
      if (week.id === weekId) {
        // Δημιουργούμε τα 5 μόνιμα blocks που θα υπάρχουν πάντα
        const permanentBlocks = [
          {
            id: generateId(),
            name: 'mobility',
            training_type: 'mobility' as const,
            block_order: 1,
            program_exercises: []
          },
          {
            id: generateId(),
            name: 'stability',
            training_type: 'stability' as const,
            block_order: 2,
            program_exercises: []
          },
          {
            id: generateId(),
            name: 'activation',
            training_type: 'activation' as const,
            block_order: 3,
            program_exercises: []
          },
          {
            id: generateId(),
            name: 'neural act',
            training_type: 'neural act' as const,
            block_order: 4,
            program_exercises: []
          },
          {
            id: generateId(),
            name: 'recovery',
            training_type: 'recovery' as const,
            block_order: 5,
            program_exercises: []
          }
        ];

        const newDay = {
          id: generateId(),
          name: `Ημέρα ${(week.program_days?.length || 0) + 1}`,
          day_number: (week.program_days?.length || 0) + 1,
          program_blocks: permanentBlocks
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

  const duplicateDay = async (weekId: string, dayId: string) => {
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

    // Αν το πρόγραμμα έχει ID και υπάρχει saveProgram function, αποθήκευσε αμέσως
    if (program.id && saveProgram) {
      try {
        console.log('💾 Auto-saving after day duplication...');
        await saveProgram({ ...program, weeks: updatedWeeks });
        console.log('✅ Day duplication saved to database');
      } catch (error) {
        console.error('❌ Failed to save day duplication:', error);
      }
    }
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

  return {
    addDay,
    removeDay,
    duplicateDay,
    updateDayName
  };
};
