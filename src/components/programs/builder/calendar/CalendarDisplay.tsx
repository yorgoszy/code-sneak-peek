
import React, { useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Trash2 } from "lucide-react";
import { parseISO, addMonths, subMonths } from "date-fns";
import { el } from "date-fns/locale";

interface CalendarDisplayProps {
  selectedDatesAsStrings: string[];
  totalDays: number;
  currentWeekInfo: any;
  onDateSelect: (date: Date | undefined) => void;
  onClearAllDates: () => void;
  isDateSelected: (date: Date) => boolean;
  isDateDisabled: (date: Date) => boolean;
}

export const CalendarDisplay: React.FC<CalendarDisplayProps> = ({
  selectedDatesAsStrings,
  totalDays,
  currentWeekInfo,
  onDateSelect,
  onClearAllDates,
  isDateSelected,
  isDateDisabled
}) => {
  const calendarRef = useRef<HTMLDivElement>(null);
  const [currentMonth, setCurrentMonth] = React.useState(new Date());

  useEffect(() => {
    const calendarElement = calendarRef.current;
    if (!calendarElement) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (e.deltaY > 0) {
        // Scroll down = next month
        setCurrentMonth(prev => addMonths(prev, 1));
      } else {
        // Scroll up = previous month
        setCurrentMonth(prev => subMonths(prev, 1));
      }
    };

    calendarElement.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      calendarElement.removeEventListener('wheel', handleWheel);
    };
  }, []);

  return (
    <Card className="rounded-none">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Επιλογή Ημερομηνιών Προπόνησης
          </div>
          {selectedDatesAsStrings.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearAllDates}
              className="rounded-none"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Καθαρισμός
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="flex justify-center">
          <div ref={calendarRef} className="cursor-pointer">
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
                selected: (date) => isDateSelected(date)
              }}
              modifiersStyles={{
                selected: {
                  backgroundColor: '#00ffba',
                  color: '#000000'
                }
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
