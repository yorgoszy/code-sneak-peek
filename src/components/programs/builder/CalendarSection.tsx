
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProgramStructure } from './hooks/useProgramBuilderState';
import { CalendarDisplay } from './calendar/CalendarDisplay';
import { WeekProgressDisplay } from './calendar/WeekProgressDisplay';
import { ProgramRequirements } from './calendar/ProgramRequirements';
import { SelectedDatesDisplay } from './calendar/SelectedDatesDisplay';
import { SelectionProgress } from './calendar/SelectionProgress';
import { useCalendarLogic } from './calendar/hooks/useCalendarLogic';

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
  const {
    weekStructure,
    selectedDatesAsStrings,
    currentWeekInfo,
    weekProgress,
    handleDateSelect,
    handleClearAllDates,
    isDateSelected,
    isDateDisabled
  } = useCalendarLogic(program, totalDays, onTrainingDatesChange);

  if (totalDays === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left side - Calendar */}
      <CalendarDisplay
        selectedDatesAsStrings={selectedDatesAsStrings}
        totalDays={totalDays}
        currentWeekInfo={currentWeekInfo}
        onDateSelect={handleDateSelect}
        onClearAllDates={handleClearAllDates}
        isDateSelected={isDateSelected}
        isDateDisabled={isDateDisabled}
      />

      {/* Right side - Program Details */}
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle>Απαιτήσεις Προγράμματος</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Program Stats */}
            <ProgramRequirements
              weekStructure={weekStructure}
              totalDays={totalDays}
            />

            {/* Progress per week */}
            <WeekProgressDisplay weekProgress={weekProgress} />

            {/* Selected dates list */}
            <SelectedDatesDisplay selectedDatesAsStrings={selectedDatesAsStrings} />

            {/* Selection Progress */}
            <SelectionProgress
              selectedCount={selectedDatesAsStrings.length}
              totalDays={totalDays}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
