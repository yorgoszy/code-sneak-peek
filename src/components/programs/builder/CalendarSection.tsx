
import React from 'react';
import type { ProgramStructure } from './hooks/useProgramBuilderState';
import { CalendarDisplay } from './calendar/CalendarDisplay';
import { SelectionProgress } from './calendar/SelectionProgress';
import { WeekProgressDisplay } from './calendar/WeekProgressDisplay';
import { useCalendarLogic } from './calendar/hooks/useCalendarLogic';

interface CalendarSectionProps {
  program: ProgramStructure;
  totalDays: number;
  onTrainingDatesChange: (dates: Date[]) => void;
}

export const CalendarSection: React.FC<CalendarSectionProps> = ({
  program,
  totalDays,
  onTrainingDatesChange
}) => {
  const {
    weekStructure,
    selectedDatesAsStrings,
    currentWeekInfo,
    weekProgress,
    handleDateSelect,
    handleClearAllDates,
    isDateSelected,
    isDateDisabled
  } = useCalendarLogic(program, totalDays, onTrainingDatesChange);

  if (totalDays === 0) {
    return null;
  }

  return (
    <div className="w-full">
      <div className="flex gap-6">
        <div className="flex-1">
          <CalendarDisplay
            selectedDatesAsStrings={selectedDatesAsStrings}
            totalDays={totalDays}
            currentWeekInfo={currentWeekInfo}
            onDateSelect={handleDateSelect}
            onClearAllDates={handleClearAllDates}
            isDateSelected={isDateSelected}
            isDateDisabled={isDateDisabled}
          />
        </div>
        
        <div className="w-80 space-y-4">
          <WeekProgressDisplay
            weekProgress={weekProgress}
          />
          
          <SelectionProgress
            selectedCount={selectedDatesAsStrings.length}
            totalDays={totalDays}
          />
        </div>
      </div>
    </div>
  );
};
