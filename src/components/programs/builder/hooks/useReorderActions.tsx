
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
        const days = [...(week.days || [])];
        const [reorderedItem] = days.splice(oldIndex, 1);
        days.splice(newIndex, 0, reorderedItem);
        
        // Update day numbers
        const updatedDays = days.map((day, index) => ({
          ...day,
          day_number: index + 1
        }));
        
        return { ...week, days: updatedDays };
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
          days: (week.days || []).map(day => {
            if (day.id === dayId) {
              const blocks = [...(day.blocks || [])];
              const [reorderedItem] = blocks.splice(oldIndex, 1);
              blocks.splice(newIndex, 0, reorderedItem);
              
              // Update block order
              const updatedBlocks = blocks.map((block, index) => ({
                ...block,
                block_order: index + 1
              }));
              
              return { ...day, blocks: updatedBlocks };
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
          days: (week.days || []).map(day => {
            if (day.id === dayId) {
              return {
                ...day,
                blocks: (day.blocks || []).map(block => {
                  if (block.id === blockId) {
                    const exercises = [...(block.exercises || [])];
                    const [reorderedItem] = exercises.splice(oldIndex, 1);
                    exercises.splice(newIndex, 0, reorderedItem);
                    
                    // Update exercise order
                    const updatedExercises = exercises.map((exercise, index) => ({
                      ...exercise,
                      exercise_order: index + 1
                    }));
                    
                    return { ...block, exercises: updatedExercises };
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
