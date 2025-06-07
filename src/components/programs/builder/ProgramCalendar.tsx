
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays } from "lucide-react";
import { CalendarWeekInfo } from './calendar/CalendarWeekInfo';
import { SelectedDatesDisplay } from './calendar/SelectedDatesDisplay';
import { CalendarToggle } from './calendar/CalendarToggle';
import { CalendarComponent } from './calendar/CalendarComponent';
import { CalendarMessages } from './calendar/CalendarMessages';
import { useCalendarLogic } from './calendar/useCalendarLogic';

interface ProgramCalendarProps {
  selectedDates: Date[];
  onDatesChange: (dates: Date[]) => void;
  totalDays: number;
  weeks?: any[];
}

export const ProgramCalendar: React.FC<ProgramCalendarProps> = ({
  selectedDates,
  onDatesChange,
  totalDays,
  weeks = []
}) => {
  const {
    calendarOpen,
    setCalendarOpen,
    weekStructure,
    handleDateSelect,
    removeDate,
    clearAllDates,
    validateWeekSelection,
    getCurrentWeekInfo: weekInfo
  } = useCalendarLogic({
    selectedDates,
    onDatesChange,
    totalDays,
    weeks
  });

  console.log('📅 Δομή εβδομάδων:', weekStructure);
  console.log('📅 Selected dates:', selectedDates.map(date => date.toISOString().split('T')[0]));

  return (
    <Card className="rounded-none">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5" />
            Ημερολόγιο Προπόνησης
          </CardTitle>
          <div className="text-sm text-gray-600">
            Επιλεγμένες: {selectedDates.length} / Απαιτούμενες: {totalDays}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <CalendarWeekInfo 
          weekInfo={weekInfo} 
          weekStructureLength={weekStructure.length} 
        />

        <SelectedDatesDisplay
          selectedDates={selectedDates}
          onRemoveDate={removeDate}
          onClearAll={clearAllDates}
        />

        <CalendarToggle
          calendarOpen={calendarOpen}
          onToggle={() => setCalendarOpen(!calendarOpen)}
        />

        {calendarOpen && (
          <CalendarComponent
            selectedDates={selectedDates}
            totalDays={totalDays}
            weekStructure={weekStructure}
            onDateSelect={handleDateSelect}
            onDatesChange={onDatesChange}
            validateWeekSelection={validateWeekSelection}
          />
        )}

        <CalendarMessages
          selectedDatesLength={selectedDates.length}
          totalDays={totalDays}
          weekStructure={weekStructure}
        />
      </CardContent>
    </Card>
  );
};
