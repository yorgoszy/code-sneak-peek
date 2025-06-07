
import React from 'react';
import { TrainingDateSelector } from './TrainingDateSelector';
import type { ProgramStructure } from './hooks/useProgramBuilderState';

interface CalendarSectionProps {
  program: ProgramStructure;
  onTrainingDatesChange: (dates: Date[]) => void;
}

export const CalendarSection: React.FC<CalendarSectionProps> = ({
  program,
  onTrainingDatesChange
}) => {
  // Υπολογισμός συνολικού αριθμού ημερών από όλες τις εβδομάδες - χρήση program_days
  const totalDays = program.weeks?.reduce((total, week) => {
    return total + (week.program_days?.length || 0);
  }, 0) || 0;

  console.log('📅 [CalendarSection] Program weeks:', program.weeks);
  console.log('📅 [CalendarSection] Total days calculated:', totalDays);

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
    console.log('📅 [CalendarSection] Dates changed:', dates);
    // Μετατροπή από string[] σε Date[]
    const datesAsObjects = dates.map(dateString => new Date(dateString + 'T12:00:00'));
    console.log('📅 [CalendarSection] Converted to Date objects:', datesAsObjects);
    onTrainingDatesChange(datesAsObjects);
  };

  return (
    <TrainingDateSelector
      selectedDates={selectedDatesAsStrings}
      onDatesChange={handleDatesChange}
      programWeeks={program.weeks || []}
    />
  );
};
