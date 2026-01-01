
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Trash2 } from "lucide-react";
import { parseISO } from "date-fns";
import { el } from "date-fns/locale";

interface CalendarDisplayProps {
  selectedDatesAsStrings: string[];
  totalDays: number;
  currentWeekInfo: any;
  onDateSelect: (date: Date | undefined) => void;
  onClearAllDates: () => void;
  isDateSelected: (date: Date) => boolean;
  isDateDisabled: (date: Date) => boolean;
  getDayInfoForDate: (date: Date) => { is_test_day: boolean; test_types: string[]; is_competition_day: boolean } | null;
}

export const CalendarDisplay: React.FC<CalendarDisplayProps> = ({
  selectedDatesAsStrings,
  totalDays,
  currentWeekInfo,
  onDateSelect,
  onClearAllDates,
  isDateSelected,
  isDateDisabled,
  getDayInfoForDate
}) => {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());

  return (
    <Card className="rounded-none">
      <CardHeader className="py-2">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4" />
            Επιλογή Ημερομηνιών
          </div>
          {selectedDatesAsStrings.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearAllDates}
              className="rounded-none h-6 text-xs"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Καθαρισμός
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex justify-center">
          <Calendar
            mode="multiple"
            selected={selectedDatesAsStrings.map(date => parseISO(date))}
            onDayClick={onDateSelect}
            disabled={isDateDisabled}
            className="rounded-none border"
            locale={el}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            modifiers={{
              selected: (date) => isDateSelected(date),
              testDay: (date) => {
                const dayInfo = getDayInfoForDate(date);
                return dayInfo?.is_test_day || false;
              },
              competitionDay: (date) => {
                const dayInfo = getDayInfoForDate(date);
                return dayInfo?.is_competition_day || false;
              }
            }}
            modifiersStyles={{
              selected: {
                backgroundColor: '#00ffba',
                color: '#000000'
              },
              testDay: {
                backgroundColor: '#eab308',
                color: '#000000'
              },
              competitionDay: {
                backgroundColor: '#9333ea',
                color: '#ffffff'
              }
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
};
