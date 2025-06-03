
import { ProgramStructure } from './useProgramBuilderState';

export const useBlockActions = (
  program: ProgramStructure,
  updateProgram: (updates: Partial<ProgramStructure>) => void,
  generateId: () => string
) => {
  const addBlock = (weekId: string, dayId: string) => {
    const updatedWeeks = (program.weeks || []).map(week => {
      if (week.id === weekId) {
        return {
          ...week,
          days: (week.days || []).map(day => {
            if (day.id === dayId) {
              const newBlock = {
                id: generateId(),
                name: `Μπλοκ ${(day.blocks?.length || 0) + 1}`,
                block_order: (day.blocks?.length || 0) + 1,
                exercises: []
              };
              return {
                ...day,
                blocks: [...(day.blocks || []), newBlock]
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

  const removeBlock = (weekId: string, dayId: string, blockId: string) => {
    const updatedWeeks = (program.weeks || []).map(week => {
      if (week.id === weekId) {
        return {
          ...week,
          days: (week.days || []).map(day => {
            if (day.id === dayId) {
              return {
                ...day,
                blocks: (day.blocks || []).filter(block => block.id !== blockId)
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

  const duplicateBlock = (weekId: string, dayId: string, blockId: string) => {
    const updatedWeeks = (program.weeks || []).map(week => {
      if (week.id === weekId) {
        return {
          ...week,
          days: (week.days || []).map(day => {
            if (day.id === dayId) {
              const blockToDuplicate = day.blocks?.find(block => block.id === blockId);
              if (!blockToDuplicate) return day;

              const newBlock = {
                ...JSON.parse(JSON.stringify(blockToDuplicate)),
                id: generateId(),
                name: `${blockToDuplicate.name} (Αντίγραφο)`,
                block_order: (day.blocks?.length || 0) + 1,
                exercises: blockToDuplicate.exercises.map(exercise => ({
                  ...exercise,
                  id: generateId()
                }))
              };

              return {
                ...day,
                blocks: [...(day.blocks || []), newBlock]
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

  const updateBlockName = (weekId: string, dayId: string, blockId: string, name: string) => {
    const updatedWeeks = (program.weeks || []).map(week => {
      if (week.id === weekId) {
        return {
          ...week,
          days: (week.days || []).map(day => {
            if (day.id === dayId) {
              return {
                ...day,
                blocks: (day.blocks || []).map(block =>
                  block.id === blockId ? { ...block, name } : block
                )
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
    addBlock,
    removeBlock,
    duplicateBlock,
    updateBlockName
  };
};
