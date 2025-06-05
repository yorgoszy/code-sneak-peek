
import React from 'react';
import { ProgramCalendar } from './ProgramCalendar';
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
  const selectedDatesCount = program.training_dates?.length || 0;
  const hasRequiredDates = selectedDatesCount >= totalDays;

  if (totalDays === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-none p-4">
        <h3 className="font-medium text-blue-800 mb-2">Επιλογή Ημερομηνιών Προπόνησης</h3>
        <p className="text-sm text-blue-700 mb-2">
          Επιλέξτε ακριβώς {totalDays} ημερομηνίες για τις προπονήσεις σας
        </p>
        <p className="text-xs text-blue-600">
          Επιλεγμένες: {selectedDatesCount} / {totalDays}
          {hasRequiredDates && <span className="text-green-600 ml-2">✓ Έτοιμο για ανάθεση</span>}
        </p>
      </div>
      
      <ProgramCalendar
        selectedDates={program.training_dates || []}
        onDatesChange={onTrainingDatesChange}
        totalDays={totalDays}
        weeks={program.weeks}
      />
    </div>
  );
};
