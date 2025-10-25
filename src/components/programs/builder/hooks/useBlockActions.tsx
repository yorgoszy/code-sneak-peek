
import { ProgramStructure } from './useProgramBuilderState';

export const useBlockActions = (
  program: ProgramStructure,
  updateProgram: (updates: Partial<ProgramStructure>) => void,
  generateId: () => string,
  saveProgram?: (programData: any) => Promise<any>
) => {
  const addBlock = (weekId: string, dayId: string) => {
    const updatedWeeks = (program.weeks || []).map(week => {
      if (week.id === weekId) {
        return {
          ...week,
          program_days: (week.program_days || []).map(day => {
            if (day.id === dayId) {
              const currentBlocks = day.program_blocks || [];
              
              // Βρίσκουμε το recovery block
              const recoveryIndex = currentBlocks.findIndex(b => b.training_type === 'recovery');
              
              const newBlock = {
                id: generateId(),
                name: `Μπλοκ ${currentBlocks.length + 1}`,
                block_order: currentBlocks.length + 1,
                program_exercises: []
              };
              
              let updatedBlocks;
              if (recoveryIndex !== -1) {
                // Αν υπάρχει recovery, βάζουμε το νέο block πριν από αυτό
                updatedBlocks = [
                  ...currentBlocks.slice(0, recoveryIndex),
                  newBlock,
                  ...currentBlocks.slice(recoveryIndex)
                ];
              } else {
                // Αλλιώς το βάζουμε στο τέλος
                updatedBlocks = [...currentBlocks, newBlock];
              }
              
              // Ενημερώνουμε τα block_order
              updatedBlocks = updatedBlocks.map((block, index) => ({
                ...block,
                block_order: index + 1
              }));
              
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

  const duplicateBlock = async (weekId: string, dayId: string, blockId: string) => {
    const updatedWeeks = (program.weeks || []).map(week => {
      if (week.id === weekId) {
        return {
          ...week,
          program_days: (week.program_days || []).map(day => {
            if (day.id === dayId) {
              const blockToDuplicate = day.program_blocks?.find(block => block.id === blockId);
              if (!blockToDuplicate) return day;

              // Ταξινόμηση των ασκήσεων με βάση το exercise_order ΠΡΙΝ την αντιγραφή
              const sortedExercises = [...(blockToDuplicate.program_exercises || [])].sort((a, b) => {
                const orderA = Number(a.exercise_order) || 0;
                const orderB = Number(b.exercise_order) || 0;
                return orderA - orderB;
              });

              const newBlock = {
                ...JSON.parse(JSON.stringify(blockToDuplicate)),
                id: generateId(),
                name: `${blockToDuplicate.name} (Αντίγραφο)`,
                block_order: (day.program_blocks?.length || 0) + 1,
                program_exercises: sortedExercises.map(exercise => ({
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

  const updateBlockTrainingType = (weekId: string, dayId: string, blockId: string, trainingType: string) => {
    const updatedWeeks = (program.weeks || []).map(week => {
      if (week.id === weekId) {
        return {
          ...week,
          program_days: (week.program_days || []).map(day => {
            if (day.id === dayId) {
              return {
                ...day,
                program_blocks: (day.program_blocks || []).map(block =>
                  block.id === blockId ? { ...block, training_type: trainingType as any, name: trainingType } : block
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
    updateBlockTrainingType
  };
};
