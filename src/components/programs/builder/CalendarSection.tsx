
import React from 'react';
import { TrainingDateSelector } from './TrainingDateSelector';
import type { ProgramStructure } from './hooks/useProgramBuilderState';

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
  if (totalDays === 0) {
    return null;
  }

  // Μετατροπή των training_dates από Date[] σε string[]
  const selectedDatesAsStrings = (program.training_dates || []).map(date => {
    if (typeof date === 'string') {
      return date;
    }
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  });

  const handleDatesChange = (dates: string[]) => {
    // Μετατροπή από string[] σε Date[]
    const datesAsObjects = dates.map(dateString => new Date(dateString + 'T12:00:00'));
    onTrainingDatesChange(datesAsObjects);
  };

  return (
    <TrainingDateSelector
      selectedDates={selectedDatesAsStrings}
      onDatesChange={handleDatesChange}
      programWeeks={program.weeks?.length || 0}
    />
  );
};
