
import React from 'react';
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Trash2, Move, X } from "lucide-react";
import { parseISO } from "date-fns";
import { el } from "date-fns/locale";
import { formatDateForStorage } from '@/utils/dateUtils';

interface CalendarDisplayProps {
  selectedDatesAsStrings: string[];
  totalDays: number;
  currentWeekInfo: any;
  movingDateStr: string | null;
  onDateSelect: (date: Date | undefined) => void;
  onClearAllDates: () => void;
  onCancelMove: () => void;
  onRemoveDate: (dateStr: string) => void;
  isDateSelected: (date: Date) => boolean;
  isDateDisabled: (date: Date) => boolean;
  getDayInfoForDate: (date: Date) => { is_test_day: boolean; test_types: string[]; is_competition_day: boolean } | null;
}

export const CalendarDisplay: React.FC<CalendarDisplayProps> = ({
  selectedDatesAsStrings,
  totalDays,
  currentWeekInfo,
  movingDateStr,
  onDateSelect,
  onClearAllDates,
  onCancelMove,
  onRemoveDate,
  isDateSelected,
  isDateDisabled,
  getDayInfoForDate
}) => {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());

  const isMovingDate = (date: Date) => {
    if (!movingDateStr) return false;
    return formatDateForStorage(date) === movingDateStr;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        {/* Move mode indicator */}
        {movingDateStr && (
          <div className="flex items-center gap-2 text-xs bg-amber-50 border border-amber-300 px-3 py-1.5">
            <Move className="w-3 h-3 text-amber-600" />
            <span className="text-amber-700 font-medium">Μετακίνηση ημέρας — κλικ σε νέα θέση</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancelMove}
              className="rounded-none h-5 w-5 p-0 text-amber-600 hover:text-amber-800"
            >
              <X className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemoveDate(movingDateStr)}
              className="rounded-none h-5 px-1 text-xs text-red-500 hover:text-red-700"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Διαγραφή
            </Button>
          </div>
        )}

        {!movingDateStr && selectedDatesAsStrings.length > 0 && (
          <div className="flex-1" />
        )}
        
        {selectedDatesAsStrings.length > 0 && !movingDateStr && (
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
      </div>
      <div className="flex justify-center">
        <Calendar
          mode="multiple"
          selected={selectedDatesAsStrings.map(date => parseISO(date))}
          onDayClick={(day) => onDateSelect(day)}
          className="rounded-none border"
          locale={el}
          month={currentMonth}
          onMonthChange={setCurrentMonth}
          modifiers={{
            selected: (date) => isDateSelected(date) && !isMovingDate(date),
            movingDay: (date) => isMovingDate(date),
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
              color: '#000000',
              cursor: 'grab'
            },
            movingDay: {
              backgroundColor: '#f59e0b',
              color: '#000000',
              boxShadow: '0 0 0 2px #f59e0b',
              animation: 'pulse 1.5s infinite'
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
      {!movingDateStr && selectedDatesAsStrings.length > 0 && (
        <p className="text-[10px] text-muted-foreground text-center mt-1">
          Κλικ σε επιλεγμένη ημέρα για μετακίνηση
        </p>
      )}
    </div>
  );
};
