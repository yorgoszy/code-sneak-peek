
import React from 'react';
import { format } from 'date-fns';
import { CalendarNavigation } from './CalendarNavigation';
import { CalendarWeekDays } from './CalendarWeekDays';
import { CalendarDay } from './CalendarDay';
import { MobileMonthlyView } from './MobileMonthlyView';

interface ProgramData {
  date: string;
  status: string;
  assignmentId: string;
  userName: string;
  assignment: any;
}

interface MonthlyViewProps {
  isMobile: boolean;
  weekDays: string[];
  days: Date[];
  programDatesWithStatus: ProgramData[];
  currentMonth: Date;
  selectedDate: Date | undefined;
  realtimeKey: number;
  internalRealtimeKey: number;
  setCurrentMonth: (date: Date) => void;
  onDateClick: (date: Date) => void;
  onUserNameClick: (programData: ProgramData, event: React.MouseEvent) => void;
  onDayNumberClick: (date: Date) => void;
}

export const MonthlyView: React.FC<MonthlyViewProps> = ({
  isMobile,
  weekDays,
  days,
  programDatesWithStatus,
  currentMonth,
  selectedDate,
  realtimeKey,
  internalRealtimeKey,
  setCurrentMonth,
  onDateClick,
  onUserNameClick,
  onDayNumberClick
}) => {
  return (
    <div className="w-full">
      <CalendarNavigation 
        currentMonth={currentMonth}
        setCurrentMonth={setCurrentMonth}
      />
      <div className="block md:hidden">
        <MobileMonthlyView
          weekDays={weekDays}
          days={days}
          programDatesWithStatus={programDatesWithStatus}
          currentMonth={currentMonth}
          selectedDate={selectedDate}
          realtimeKey={realtimeKey}
          internalRealtimeKey={internalRealtimeKey}
          onDateClick={onDateClick}
          onUserNameClick={onUserNameClick}
          onDayNumberClick={onDayNumberClick}
        />
      </div>
      <div className="hidden md:block">
        <CalendarWeekDays />
        <div className="grid grid-cols-7 border border-gray-200 gap-px overflow-x-auto md:overflow-x-visible"
          style={{ minWidth: 410 }}
        >
          {days.map((date) => {
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
      </div>
    </div>
  );
}
