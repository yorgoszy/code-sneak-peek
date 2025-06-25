
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon } from "lucide-react";
import { TrainingDateSelectorProps } from './types';
import { useTrainingDateLogic } from './useTrainingDateLogic';
import { TrainingDateCalendar } from './TrainingDateCalendar';
import { ProgramRequirements } from './ProgramRequirements';
import { SelectionProgress } from './SelectionProgress';

export const TrainingDateSelector: React.FC<TrainingDateSelectorProps> = ({
  selectedDates,
  onDatesChange,
  programWeeks = 0,
  weekStructure = [] // Προσθήκη του weekStructure
}) => {
  // Υπολογισμός συνολικών ημερών από τη δομή των εβδομάδων
  const totalRequiredDays = weekStructure.reduce((total, week) => {
    return total + (week.program_days?.length || 0);
  }, 0);

  // Υπολογισμός μέσων ημερών ανά εβδομάδα για εμφάνιση
  const averageDaysPerWeek = weekStructure.length > 0 
    ? Math.round(totalRequiredDays / weekStructure.length * 10) / 10 
    : 0;

  const {
    calendarDate,
    setCalendarDate,
    handleDateSelect,
    removeDate,
    clearAllDates,
    isDateSelected,
    isToday,
    isDateDisabled
  } = useTrainingDateLogic({
    selectedDates,
    onDatesChange,
    totalRequiredDays,
    weekStructure
  });

  console.log('🗓️ [TrainingDateSelector] Week structure:', weekStructure);
  console.log('🗓️ [TrainingDateSelector] Total required days:', totalRequiredDays);
  console.log('🗓️ [TrainingDateSelector] Current selectedDates:', selectedDates);

  return (
    <Card className="rounded-none">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <CalendarIcon className="w-5 h-5" />
          Επιλογή Ημερομηνιών Προπόνησης
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Calendar */}
          <div>
            <TrainingDateCalendar
              calendarDate={calendarDate}
              onCalendarDateChange={setCalendarDate}
              onDateSelect={handleDateSelect}
              isDateDisabled={isDateDisabled}
              isDateSelected={isDateSelected}
              isToday={isToday}
              onRemoveDate={removeDate}
            />
          </div>

          {/* Program Info and Progress */}
          <div className="space-y-4">
            <ProgramRequirements
              programWeeks={weekStructure.length}
              daysPerWeek={averageDaysPerWeek}
              totalRequiredDays={totalRequiredDays}
              weekStructure={weekStructure}
            />

            <SelectionProgress
              selectedDatesLength={selectedDates.length}
              totalRequiredDays={totalRequiredDays}
              onClearAll={clearAllDates}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
