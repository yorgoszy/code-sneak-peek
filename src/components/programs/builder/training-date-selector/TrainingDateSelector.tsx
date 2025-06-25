
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
  weekStructure = []
}) => {
  console.log('🗓️ [TrainingDateSelector] weekStructure received:', weekStructure);

  // Calculate actual days per week from week structure
  const getActualDaysPerWeek = () => {
    if (weekStructure.length === 0) {
      console.log('🗓️ [TrainingDateSelector] No week structure, using default 2 days');
      return 2;
    }
    
    // Calculate average days per week from the actual structure
    const totalDays = weekStructure.reduce((sum, week) => sum + week.daysInWeek, 0);
    const avgDaysPerWeek = Math.round(totalDays / weekStructure.length);
    
    console.log('🗓️ [TrainingDateSelector] Calculated days per week:', {
      totalDays,
      weeks: weekStructure.length,
      avgDaysPerWeek
    });
    
    return avgDaysPerWeek;
  };

  const daysPerWeek = getActualDaysPerWeek();
  const totalRequiredDays = weekStructure.reduce((sum, week) => sum + week.daysInWeek, 0);

  console.log('🗓️ [TrainingDateSelector] Final calculations:', {
    daysPerWeek,
    totalRequiredDays,
    programWeeks
  });

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
