
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
  programWeeks = 0
}) => {
  // Get the actual program structure from the parent component
  // For now, we'll create a mock structure - this should be passed as props
  const getWeekStructure = () => {
    // This is a placeholder - in reality, this should come from the program data
    // You'll need to pass the actual weeks structure as a prop
    return [
      { weekNumber: 1, daysInWeek: 1 },
      { weekNumber: 2, daysInWeek: 2 },
      { weekNumber: 3, daysInWeek: 2 },
      { weekNumber: 4, daysInWeek: 2 }
    ];
  };

  const weekStructure = getWeekStructure();
  const totalRequiredDays = weekStructure.reduce((total, week) => total + week.daysInWeek, 0);

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
            {/* Week Structure Display */}
            <div className="bg-blue-50 border border-blue-200 rounded-none p-4">
              <h4 className="font-medium text-blue-800 mb-2">Δομή Εβδομάδων</h4>
              <div className="space-y-1 text-sm">
                {weekStructure.map((week, index) => (
                  <p key={index}>
                    <strong>Εβδομάδα {week.weekNumber}:</strong> {week.daysInWeek} {week.daysInWeek === 1 ? 'ημέρα' : 'ημέρες'}
                  </p>
                ))}
                <p className="text-lg font-bold text-blue-700 mt-2">
                  Σύνολο: {totalRequiredDays} ημέρες προπόνησης
                </p>
              </div>
            </div>

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
