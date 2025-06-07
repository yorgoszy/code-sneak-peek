
import { ProgramStructure } from './useProgramBuilderState';

export const useWeekActions = (
  program: ProgramStructure,
  updateProgram: (updates: Partial<ProgramStructure>) => void,
  generateId: () => string
) => {
  const addWeek = () => {
    const newWeek = {
      id: generateId(),
      name: `Εβδομάδα ${(program.weeks?.length || 0) + 1}`,
      week_number: (program.weeks?.length || 0) + 1,
      days: []
    };

    const updatedWeeks = [...(program.weeks || []), newWeek];
    updateProgram({ weeks: updatedWeeks });
  };

  const removeWeek = (weekId: string) => {
    const updatedWeeks = (program.weeks || []).filter(week => week.id !== weekId);
    updateProgram({ weeks: updatedWeeks });
  };

  const duplicateWeek = (weekId: string) => {
    const weekToDuplicate = program.weeks?.find(week => week.id === weekId);
    if (!weekToDuplicate) return;

    const newWeek = {
      ...JSON.parse(JSON.stringify(weekToDuplicate)),
      id: generateId(),
      name: `${weekToDuplicate.name} (Αντίγραφο)`,
      week_number: (program.weeks?.length || 0) + 1,
      days: weekToDuplicate.days.map(day => ({
        ...day,
        id: generateId(),
        program_blocks: day.program_blocks.map(block => ({
          ...block,
          id: generateId(),
          exercises: block.exercises.map(exercise => ({
            ...exercise,
            id: generateId()
          }))
        }))
      }))
    };

    const updatedWeeks = [...(program.weeks || []), newWeek];
    updateProgram({ weeks: updatedWeeks });
  };

  const updateWeekName = (weekId: string, name: string) => {
    const updatedWeeks = (program.weeks || []).map(week =>
      week.id === weekId ? { ...week, name } : week
    );
    updateProgram({ weeks: updatedWeeks });
  };

  return {
    addWeek,
    removeWeek,
    duplicateWeek,
    updateWeekName
  };
};
