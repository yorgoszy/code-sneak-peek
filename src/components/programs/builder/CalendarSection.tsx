
import React from 'react';
import type { ProgramStructure } from './hooks/useProgramBuilderState';
import { CalendarDisplay } from './calendar/CalendarDisplay';
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
    <div className="w-full">
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
  );
};
