
import React from 'react';
import { DateSelectionCard } from './DateSelectionCard';
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

  // Calculate days per week from the program structure
  const calculateDaysPerWeek = () => {
    if (!program.weeks || program.weeks.length === 0) return 2;
    
    const totalDaysInProgram = program.weeks.reduce((sum, week) => sum + (week.program_days?.length || 0), 0);
    return Math.round(totalDaysInProgram / program.weeks.length);
  };

  const daysPerWeek = calculateDaysPerWeek();
  const totalWeeks = program.weeks?.length || 0;

  // Convert training_dates from Date[] to string[]
  const selectedDatesAsStrings = (program.training_dates || []).map(date => {
    if (typeof date === 'string') {
      return date;
    }
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  });

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    const dateString = date.toISOString().split('T')[0];
    const currentDates = selectedDatesAsStrings.slice();
    
    if (currentDates.includes(dateString)) {
      // Remove date if already selected
      const newDates = currentDates.filter(d => d !== dateString);
      const datesAsObjects = newDates.map(dateStr => new Date(dateStr + 'T12:00:00'));
      onTrainingDatesChange(datesAsObjects);
    } else if (currentDates.length < totalDays) {
      // Add date if under limit
      const newDates = [...currentDates, dateString].sort();
      const datesAsObjects = newDates.map(dateStr => new Date(dateStr + 'T12:00:00'));
      onTrainingDatesChange(datesAsObjects);
    }
  };

  const handleClearAllDates = () => {
    onTrainingDatesChange([]);
  };

  const isDateSelected = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return selectedDatesAsStrings.includes(dateString);
  };

  const isDateDisabled = (date: Date) => {
    // Disable past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return true;

    // If date is already selected, allow it (for deselection)
    if (isDateSelected(date)) return false;

    // Don't allow more selections if we've reached the limit
    return selectedDatesAsStrings.length >= totalDays;
  };

  return (
    <DateSelectionCard
      selectedDates={selectedDatesAsStrings}
      daysPerWeek={daysPerWeek}
      totalWeeks={totalWeeks}
      totalRequiredSessions={totalDays}
      onDateSelect={handleDateSelect}
      onClearAllDates={handleClearAllDates}
      isDateSelected={isDateSelected}
      isDateDisabled={isDateDisabled}
      completedDates={[]}
      editMode={false}
    />
  );
};
