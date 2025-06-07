
import { ProgramStructure } from './useProgramBuilderState';

export const useDayActions = (
  program: ProgramStructure,
  updateProgram: (updates: Partial<ProgramStructure>) => void,
  generateId: () => string
) => {
  const addDay = (weekId: string) => {
    const updatedWeeks = (program.weeks || []).map(week => {
      if (week.id === weekId) {
        const newDay = {
          id: generateId(),
          name: `Ημέρα ${(week.days?.length || 0) + 1}`,
          day_number: (week.days?.length || 0) + 1,
          blocks: []
        };
        return {
          ...week,
          days: [...(week.days || []), newDay]
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
          days: (week.days || []).filter(day => day.id !== dayId)
        };
      }
      return week;
    });
    updateProgram({ weeks: updatedWeeks });
  };

  const duplicateDay = (weekId: string, dayId: string) => {
    const updatedWeeks = (program.weeks || []).map(week => {
      if (week.id === weekId) {
        const dayToDuplicate = week.days?.find(day => day.id === dayId);
        if (!dayToDuplicate) return week;

        const newDay = {
          ...JSON.parse(JSON.stringify(dayToDuplicate)),
          id: generateId(),
          name: `${dayToDuplicate.name} (Αντίγραφο)`,
          day_number: (week.days?.length || 0) + 1,
          blocks: dayToDuplicate.blocks.map(block => ({
            ...block,
            id: generateId(),
            exercises: block.exercises.map(exercise => ({
              ...exercise,
              id: generateId()
            }))
          }))
        };

        return {
          ...week,
          days: [...(week.days || []), newDay]
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
          days: (week.days || []).map(day =>
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
