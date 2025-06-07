
import { ProgramStructure } from './useProgramBuilderState';

export const useDayActions = (
  program: ProgramStructure,
  updateProgram: (updates: Partial<ProgramStructure>) => void,
  generateId: () => string
) => {
  const addDay = (weekId: string) => {
    console.log('🔵 useDayActions.addDay called with weekId:', weekId);
    console.log('🔵 Current program weeks:', program.weeks);
    
    const updatedWeeks = (program.weeks || []).map(week => {
      if (week.id === weekId) {
        console.log('🔵 Found week to update:', week.name);
        console.log('🔵 Current program_days:', week.program_days);
        
        const currentDays = week.program_days || [];
        const newDayNumber = currentDays.length + 1;
        
        const newDay = {
          id: generateId(),
          name: `Ημέρα ${newDayNumber}`,
          day_number: newDayNumber,
          estimated_duration_minutes: 60,
          program_blocks: []
        };
        
        console.log('🔵 Created new day:', newDay);
        
        const updatedWeek = {
          ...week,
          program_days: [...currentDays, newDay]
        };
        
        console.log('🔵 Updated week with new day:', updatedWeek);
        return updatedWeek;
      }
      return week;
    });
    
    console.log('🔵 All updated weeks:', updatedWeeks);
    updateProgram({ weeks: updatedWeeks });
    console.log('✅ Program updated with new day');
  };

  const removeDay = (weekId: string, dayId: string) => {
    console.log('🔴 Removing day:', dayId, 'from week:', weekId);
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
    console.log('🟡 Duplicating day:', dayId, 'in week:', weekId);
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
    console.log('📝 Updating day name:', dayId, 'to:', name);
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
