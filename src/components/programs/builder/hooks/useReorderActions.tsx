
import { ProgramStructure } from './useProgramBuilderState';

export const useReorderActions = (
  program: ProgramStructure,
  updateProgram: (updates: Partial<ProgramStructure>) => void
) => {
  const reorderWeeks = (oldIndex: number, newIndex: number) => {
    const weeks = [...(program.weeks || [])];
    const [reorderedItem] = weeks.splice(oldIndex, 1);
    weeks.splice(newIndex, 0, reorderedItem);
    
    // Update week numbers
    const updatedWeeks = weeks.map((week, index) => ({
      ...week,
      week_number: index + 1
    }));
    
    updateProgram({ weeks: updatedWeeks });
  };

  const reorderDays = (weekId: string, oldIndex: number, newIndex: number) => {
    const updatedWeeks = (program.weeks || []).map(week => {
      if (week.id === weekId) {
        const program_days = [...(week.program_days || [])];
        const [reorderedItem] = program_days.splice(oldIndex, 1);
        program_days.splice(newIndex, 0, reorderedItem);
        
        // Update day numbers
        const updatedDays = program_days.map((day, index) => ({
          ...day,
          day_number: index + 1
        }));
        
        return { ...week, program_days: updatedDays };
      }
      return week;
    });
    updateProgram({ weeks: updatedWeeks });
  };

  const reorderBlocks = (weekId: string, dayId: string, oldIndex: number, newIndex: number) => {
    const updatedWeeks = (program.weeks || []).map(week => {
      if (week.id === weekId) {
        return {
          ...week,
          program_days: (week.program_days || []).map(day => {
            if (day.id === dayId) {
              const program_blocks = [...(day.program_blocks || [])];
              const [reorderedItem] = program_blocks.splice(oldIndex, 1);
              program_blocks.splice(newIndex, 0, reorderedItem);
              
              // Βρίσκουμε το recovery block
              const recoveryIndex = program_blocks.findIndex(b => b.training_type === 'recovery');
              
              let finalBlocks;
              if (recoveryIndex !== -1 && recoveryIndex !== program_blocks.length - 1) {
                // Αν το recovery δεν είναι ήδη τελευταίο, το μετακινούμε στο τέλος
                const recoveryBlock = program_blocks[recoveryIndex];
                finalBlocks = [
                  ...program_blocks.slice(0, recoveryIndex),
                  ...program_blocks.slice(recoveryIndex + 1),
                  recoveryBlock
                ];
              } else {
                finalBlocks = program_blocks;
              }
              
              // Update block order
              const updatedBlocks = finalBlocks.map((block, index) => ({
                ...block,
                block_order: index + 1
              }));
              
              return { ...day, program_blocks: updatedBlocks };
            }
            return day;
          })
        };
      }
      return week;
    });
    updateProgram({ weeks: updatedWeeks });
  };

  const reorderExercises = (weekId: string, dayId: string, blockId: string, oldIndex: number, newIndex: number) => {
    const updatedWeeks = (program.weeks || []).map(week => {
      if (week.id === weekId) {
        return {
          ...week,
          program_days: (week.program_days || []).map(day => {
            if (day.id === dayId) {
              return {
                ...day,
                program_blocks: (day.program_blocks || []).map(block => {
                  if (block.id === blockId) {
                    const program_exercises = [...(block.program_exercises || [])];
                    const [reorderedItem] = program_exercises.splice(oldIndex, 1);
                    program_exercises.splice(newIndex, 0, reorderedItem);
                    
                    // Update exercise order
                    const updatedExercises = program_exercises.map((exercise, index) => ({
                      ...exercise,
                      exercise_order: index + 1
                    }));
                    
                    return { ...block, program_exercises: updatedExercises };
                  }
                  return block;
                })
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
    reorderWeeks,
    reorderDays,
    reorderBlocks,
    reorderExercises
  };
};
