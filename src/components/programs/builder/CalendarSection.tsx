
import React from 'react';
import { TrainingDateSelector } from './training-date-selector';
import type { ProgramStructure } from './hooks/useProgramBuilderState';

interface WeekStructure {
  weekNumber: number;
  daysInWeek: number;
}

interface CalendarSectionProps {
  program: ProgramStructure;
  totalDays: number;
  weekStructure?: WeekStructure[];
  onTrainingDatesChange: (dates: Date[]) => void;
}

export const CalendarSection: React.FC<CalendarSectionProps> = ({
  program,
  totalDays,
  weekStructure = [],
  onTrainingDatesChange
}) => {
  // Convert string dates to Date objects for the selector
  const selectedDates = (program.training_dates || []).map(dateStr => {
    if (typeof dateStr === 'string') {
      return dateStr;
    }
    // If it's already a Date object, convert to string
    return dateStr instanceof Date ? dateStr.toISOString().split('T')[0] : dateStr;
  });

  const handleDatesChange = (dates: string[]) => {
    // Convert string dates back to Date objects
    const dateObjects = dates.map(dateStr => new Date(dateStr + 'T00:00:00'));
    onTrainingDatesChange(dateObjects);
  };

  console.log('📅 [CalendarSection] Week structure received:', weekStructure);
  console.log('📅 [CalendarSection] Total days:', totalDays);
  console.log('📅 [CalendarSection] Selected dates:', selectedDates);

  return (
    <TrainingDateSelector
      selectedDates={selectedDates}
      onDatesChange={handleDatesChange}
      programWeeks={program.weeks?.length || 0}
      weekStructure={weekStructure}
    />
  );
};
