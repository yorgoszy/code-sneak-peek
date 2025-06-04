
import React, { useState } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { CalendarHeader } from './calendar/CalendarHeader';
import { CalendarGrid } from './calendar/CalendarGrid';
import { useActivePrograms } from '@/hooks/useActivePrograms';
import { useWorkoutCompletionsCache } from '@/hooks/useWorkoutCompletionsCache';
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface ProgramCalendarProps {
  programs?: EnrichedAssignment[];
  onRefresh?: () => void;
  isCompactMode?: boolean;
  containerId?: string;
  onProgramClick?: (program: EnrichedAssignment, date: Date, status: string) => void;
}

export const ProgramCalendar: React.FC<ProgramCalendarProps> = ({
  programs: externalPrograms,
  onRefresh,
  isCompactMode = false,
  containerId,
  onProgramClick
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const { 
    programs: internalPrograms, 
    loading, 
    refetch: internalRefresh
  } = useActivePrograms();

  const { getAllCompletions } = useWorkoutCompletionsCache();

  const programs = externalPrograms || internalPrograms;
  const refresh = onRefresh || internalRefresh;
  const allCompletions = getAllCompletions();

  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${isCompactMode ? 'h-full' : 'min-h-[400px]'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Φόρτωση προγραμμάτων...</p>
        </div>
      </div>
    );
  }

  const start = startOfMonth(currentDate);
  const end = endOfMonth(currentDate);
  
  // Extend to show full weeks
  const startDate = new Date(start);
  startDate.setDate(start.getDate() - (start.getDay() === 0 ? 6 : start.getDay() - 1));
  
  const endDate = new Date(end);
  const daysUntilSunday = 7 - end.getDay();
  if (daysUntilSunday < 7) {
    endDate.setDate(end.getDate() + daysUntilSunday);
  }

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  return (
    <div className={`${isCompactMode ? 'h-full' : ''} flex flex-col`}>
      {!isCompactMode && (
        <CalendarHeader
          currentDate={currentDate}
          onPreviousMonth={handlePreviousMonth}
          onNextMonth={handleNextMonth}
        />
      )}
      
      <div className={isCompactMode ? 'flex-1 min-h-0' : ''}>
        <CalendarGrid
          days={days}
          currentDate={currentDate}
          programs={programs}
          allCompletions={allCompletions}
          onRefresh={refresh}
          isCompactMode={isCompactMode}
          containerId={containerId}
          onProgramClick={onProgramClick}
        />
      </div>
    </div>
  );
};
