
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
          program_days: (week.program_days || []).map(day => {
            if (day.id === dayId) {
              const newBlock = {
                id: generateId(),
                name: `Μπλοκ ${(day.program_blocks?.length || 0) + 1}`,
                block_order: (day.program_blocks?.length || 0) + 1,
                program_exercises: []
              };
              return {
                ...day,
                program_blocks: [...(day.program_blocks || []), newBlock]
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
          program_days: (week.program_days || []).map(day => {
            if (day.id === dayId) {
              return {
                ...day,
                program_blocks: (day.program_blocks || []).filter(block => block.id !== blockId)
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
          program_days: (week.program_days || []).map(day => {
            if (day.id === dayId) {
              const blockToDuplicate = day.program_blocks?.find(block => block.id === blockId);
              if (!blockToDuplicate) return day;

              const newBlock = {
                ...JSON.parse(JSON.stringify(blockToDuplicate)),
                id: generateId(),
                name: `${blockToDuplicate.name} (Αντίγραφο)`,
                block_order: (day.program_blocks?.length || 0) + 1,
                program_exercises: blockToDuplicate.program_exercises.map(exercise => ({
                  ...exercise,
                  id: generateId()
                }))
              };

              return {
                ...day,
                program_blocks: [...(day.program_blocks || []), newBlock]
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
          program_days: (week.program_days || []).map(day => {
            if (day.id === dayId) {
              return {
                ...day,
                program_blocks: (day.program_blocks || []).map(block =>
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

  const updateBlock = (weekId: string, dayId: string, blockId: string, field: string, value: any) => {
    const updatedWeeks = (program.weeks || []).map(week => {
      if (week.id === weekId) {
        return {
          ...week,
          program_days: (week.program_days || []).map(day => {
            if (day.id === dayId) {
              return {
                ...day,
                program_blocks: (day.program_blocks || []).map(block =>
                  block.id === blockId ? { ...block, [field]: value } : block
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
    updateBlockName,
    updateBlock
  };
};
