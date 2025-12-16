
import React, { useState, useEffect } from 'react';
import { useWorkoutCompletions } from "@/hooks/useWorkoutCompletions";
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

export const useEditableProgramState = (isOpen: boolean, assignment: EnrichedAssignment | null) => {
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);
  const [completions, setCompletions] = useState<any[]>([]);
  const [dayProgramOpen, setDayProgramOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<any>(null);
  const [selectedWeek, setSelectedWeek] = useState<any>(null);
  const [programData, setProgramData] = useState<any>(null);
  const [originalProgramData, setOriginalProgramData] = useState<any>(null); // Backup για ακύρωση
  const [isEditing, setIsEditing] = useState(false);
  const { getWorkoutCompletions } = useWorkoutCompletions();

  useEffect(() => {
    if (isOpen && assignment?.programs) {
      console.log('📊 Assignment data:', assignment);
      console.log('📊 Program weeks:', assignment.programs?.program_weeks);
      const programDataCopy = JSON.parse(JSON.stringify(assignment.programs));
      setProgramData(programDataCopy);
      setOriginalProgramData(JSON.parse(JSON.stringify(programDataCopy))); // Backup
      fetchCompletions();
    }
  }, [isOpen, assignment]);

  const fetchCompletions = async () => {
    if (!assignment?.id) return;
    try {
      const data = await getWorkoutCompletions(assignment.id);
      setCompletions(data);
    } catch (error) {
      console.error('Error fetching completions:', error);
    }
  };

  const isWorkoutCompleted = (weekNumber: number, dayNumber: number) => {
    if (!assignment?.training_dates) return false;
    
    const program = assignment.programs;
    if (!program?.program_weeks?.[0]?.program_days) return false;
    
    const daysPerWeek = program.program_weeks[0].program_days.length;
    const totalDayIndex = ((weekNumber - 1) * daysPerWeek) + (dayNumber - 1);
    
    if (totalDayIndex >= assignment.training_dates.length) return false;
    
    const dateStr = assignment.training_dates[totalDayIndex];
    
    return completions.some(c => 
      c.scheduled_date === dateStr && 
      c.status === 'completed'
    );
  };

  const isWeekCompleted = (weekNumber: number, totalDaysInWeek: number) => {
    let completedDays = 0;
    for (let dayNumber = 1; dayNumber <= totalDaysInWeek; dayNumber++) {
      if (isWorkoutCompleted(weekNumber, dayNumber)) {
        completedDays++;
      }
    }
    return completedDays === totalDaysInWeek;
  };

  const getDayRpe = (weekNumber: number, dayNumber: number): number | null => {
    if (!assignment?.training_dates) return null;
    
    const program = assignment.programs;
    if (!program?.program_weeks?.[0]?.program_days) return null;
    
    const daysPerWeek = program.program_weeks[0].program_days.length;
    const totalDayIndex = ((weekNumber - 1) * daysPerWeek) + (dayNumber - 1);
    
    if (totalDayIndex >= assignment.training_dates.length) return null;
    
    const dateStr = assignment.training_dates[totalDayIndex];
    
    const completion = completions.find(c => 
      c.scheduled_date === dateStr && 
      c.status === 'completed'
    );
    
    return completion?.rpe_score ?? null;
  };

  const resetToOriginal = () => {
    if (originalProgramData) {
      setProgramData(JSON.parse(JSON.stringify(originalProgramData)));
    }
  };

  const updateOriginalData = () => {
    if (programData) {
      setOriginalProgramData(JSON.parse(JSON.stringify(programData)));
    }
  };

  return {
    selectedWeekIndex,
    setSelectedWeekIndex,
    completions,
    dayProgramOpen,
    setDayProgramOpen,
    selectedDay,
    setSelectedDay,
    selectedWeek,
    setSelectedWeek,
    programData,
    setProgramData,
    originalProgramData,
    isEditing,
    setIsEditing,
    fetchCompletions,
    isWorkoutCompleted,
    isWeekCompleted,
    getDayRpe,
    resetToOriginal,
    updateOriginalData
  };
};
