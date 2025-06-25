
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon } from "lucide-react";
import { TrainingDateSelectorProps } from './types';
import { useTrainingDateLogic } from './useTrainingDateLogic';
import { TrainingDateCalendar } from './TrainingDateCalendar';
import { ProgramRequirements } from './ProgramRequirements';
import { SelectionProgress } from './SelectionProgress';
import { Instructions } from './Instructions';

export const TrainingDateSelector: React.FC<TrainingDateSelectorProps> = ({
  selectedDates,
  onDatesChange,
  programWeeks = 0
}) => {
  // Calculate days per week from the first week structure if available
  const getDaysPerWeek = () => {
    // This should come from the program structure, but for now we'll use a default
    // You might need to pass this as a prop from the parent component
    return 2; // Default to 2 days per week
  };

  const daysPerWeek = getDaysPerWeek();
  const totalRequiredDays = programWeeks * daysPerWeek;

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
    totalRequiredDays
  });

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
              programWeeks={programWeeks}
              daysPerWeek={daysPerWeek}
              totalRequiredDays={totalRequiredDays}
            />

            <SelectionProgress
              selectedDatesLength={selectedDates.length}
              totalRequiredDays={totalRequiredDays}
              onClearAll={clearAllDates}
            />
          </div>
        </div>
        
        {/* Instructions */}
        <Instructions totalRequiredDays={totalRequiredDays} />
      </CardContent>
    </Card>
  );
};
