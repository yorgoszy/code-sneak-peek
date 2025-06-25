
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
  // Convert Date objects to string dates for the selector
  const selectedDates = (program.training_dates || []).map(date => {
    if (typeof date === 'string') {
      console.log('📅 [CalendarSection] Already string date:', date);
      return date;
    }
    // If it's a Date object, convert to string
    const dateStr = date instanceof Date ? date.toISOString().split('T')[0] : date;
    console.log('📅 [CalendarSection] Converted Date to string:', date, '->', dateStr);
    return dateStr;
  });

  const handleDatesChange = (dates: string[]) => {
    console.log('📅 [CalendarSection] handleDatesChange called with:', dates);
    
    // Convert string dates back to Date objects
    const dateObjects = dates.map(dateStr => {
      const dateObj = new Date(dateStr + 'T00:00:00');
      console.log('📅 [CalendarSection] Converting string to Date:', dateStr, '->', dateObj);
      return dateObj;
    });
    
    console.log('📅 [CalendarSection] Final date objects:', dateObjects);
    onTrainingDatesChange(dateObjects);
  };

  console.log('📅 [CalendarSection] Week structure received:', weekStructure);
  console.log('📅 [CalendarSection] Total days:', totalDays);
  console.log('📅 [CalendarSection] Selected dates (strings):', selectedDates);
  console.log('📅 [CalendarSection] Program training_dates:', program.training_dates);

  return (
    <TrainingDateSelector
      selectedDates={selectedDates}
      onDatesChange={handleDatesChange}
      programWeeks={program.weeks?.length || 0}
      weekStructure={weekStructure}
    />
  );
};
