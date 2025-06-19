
import React from 'react';
import { format } from "date-fns";
import { CalendarDay } from './CalendarDay';

interface ProgramData {
  date: string;
  status: string;
  assignmentId: string;
  userName: string;
  assignment: any;
}

interface MobileMonthlyViewProps {
  weekDays: string[];
  days: Date[];
  programDatesWithStatus: ProgramData[];
  currentMonth: Date;
  selectedDate: Date | undefined;
  realtimeKey: number;
  internalRealtimeKey: number;
  onDateClick: (date: Date) => void;
  onUserNameClick: (programData: ProgramData, event: React.MouseEvent) => void;
  onDayNumberClick: (date: Date) => void;
}

export const MobileMonthlyView: React.FC<MobileMonthlyViewProps> = ({
  weekDays,
  days,
  programDatesWithStatus,
  currentMonth,
  selectedDate,
  realtimeKey,
  internalRealtimeKey,
  onDateClick,
  onUserNameClick,
  onDayNumberClick,
}) => {
  // Group days into columns for each weekday
  const columns = Array.from({ length: 7 }, (_, colIdx) => {
    return days.filter((date, i) => i % 7 === colIdx);
  });

  return (
    <div className="flex w-full overflow-hidden">
      {columns.map((colDays, colIdx) => (
        <div key={weekDays[colIdx]} className="flex flex-col flex-1 min-w-0">
          <div
            className="
              h-8 md:h-12 flex items-center justify-center border-b border-gray-200
              text-xs font-medium text-gray-600 bg-white select-none rounded-none
              px-1
            "
            style={{ minWidth: 0 }}
          >
            <span className="truncate">{weekDays[colIdx]}</span>
          </div>
          {colDays.map((date) => {
            const dateStr = format(date, 'yyyy-MM-dd');
            const dateProgramsWithStatus = programDatesWithStatus.filter(d => d.date === dateStr);
            const enhancedKey = `${dateStr}-${realtimeKey}-${internalRealtimeKey}-${Date.now()}`;
            return (
              <CalendarDay
                key={enhancedKey}
                date={date}
                currentMonth={currentMonth}
                selectedDate={selectedDate}
                programsForDate={dateProgramsWithStatus}
                realtimeKey={realtimeKey + internalRealtimeKey}
                onDateClick={onDateClick}
                onUserNameClick={onUserNameClick}
                onDayNumberClick={onDayNumberClick}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
};
