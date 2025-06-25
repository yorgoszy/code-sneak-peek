
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon } from "lucide-react";
import { TrainingDateSelectorProps } from './types';
import { useTrainingDateLogic } from './useTrainingDateLogic';
import { TrainingDateCalendar } from './TrainingDateCalendar';
import { SelectionProgress } from './SelectionProgress';

export const TrainingDateSelector: React.FC<TrainingDateSelectorProps> = ({
  selectedDates,
  onDatesChange,
  programWeeks = 0,
  weekStructure
}) => {
  // Use actual week structure or calculate from program weeks
  const actualWeekStructure = weekStructure || [];
  const totalRequiredDays = actualWeekStructure.reduce((total, week) => total + week.daysInWeek, 0);

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
    weekStructure: actualWeekStructure
  });

  console.log('🗓️ [TrainingDateSelector] Week structure:', actualWeekStructure);
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
            {actualWeekStructure.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-none p-4">
                <h4 className="font-medium text-blue-800 mb-2">Δομή Εβδομάδων</h4>
                <div className="space-y-1 text-sm">
                  {actualWeekStructure.map((week, index) => (
                    <p key={index}>
                      <strong>Εβδομάδα {week.weekNumber}:</strong> {week.daysInWeek} {week.daysInWeek === 1 ? 'ημέρα' : 'ημέρες'}
                    </p>
                  ))}
                  <p className="text-lg font-bold text-blue-700 mt-2">
                    Σύνολο: {totalRequiredDays} ημέρες προπόνησης
                  </p>
                </div>
              </div>
            )}

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
