
import React from "react";
import { format } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";
import { CalendarDay } from "@/components/active-programs/calendar/CalendarDay";
import { MobileMonthlyView } from "@/components/active-programs/calendar/MobileMonthlyView";

interface ProgramData {
  date: string;
  status: string;
  assignmentId: string;
  userName: string;
  assignment: any;
}

interface UserMonthlyViewProps {
  weekDays: string[];
  days: Date[];
  programDatesWithStatus: ProgramData[];
  currentMonth: Date;
  selectedDate: Date | undefined;
  setCurrentMonth: (date: Date) => void;
  onDateClick: (date: Date) => void;
  onUserNameClick: (programData: ProgramData, event: React.MouseEvent) => void;
  onDayNumberClick: (date: Date) => void;
  realtimeKey: number;
  internalRealtimeKey: number;
}

export const UserMonthlyView: React.FC<UserMonthlyViewProps> = ({
  weekDays,
  days,
  programDatesWithStatus,
  currentMonth,
  selectedDate,
  setCurrentMonth,
  onDateClick,
  onUserNameClick,
  onDayNumberClick,
  realtimeKey,
  internalRealtimeKey
}) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
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
    );
  }

  // Desktop/tablet εμφάνιση grid
  return (
    <div className="w-full">
      <div className="hidden md:block">
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
};
