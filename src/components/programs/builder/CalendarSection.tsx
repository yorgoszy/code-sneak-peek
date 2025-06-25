
import React from 'react';
import type { ProgramStructure } from './hooks/useProgramBuilderState';
import { CalendarDisplay } from './calendar/CalendarDisplay';
import { SelectionProgress } from './calendar/SelectionProgress';
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
    selectedDatesAsStrings,
    currentWeekInfo,
    handleDateSelect,
    handleClearAllDates,
    isDateSelected,
    isDateDisabled
  } = useCalendarLogic(program, totalDays, onTrainingDatesChange);

  if (totalDays === 0) {
    return null;
  }

  return (
    <div className="w-full space-y-4">
      <CalendarDisplay
        selectedDatesAsStrings={selectedDatesAsStrings}
        totalDays={totalDays}
        currentWeekInfo={currentWeekInfo}
        onDateSelect={handleDateSelect}
        onClearAllDates={handleClearAllDates}
        isDateSelected={isDateSelected}
        isDateDisabled={isDateDisabled}
      />
      
      <SelectionProgress
        selectedCount={selectedDatesAsStrings.length}
        totalDays={totalDays}
      />
    </div>
  );
};
