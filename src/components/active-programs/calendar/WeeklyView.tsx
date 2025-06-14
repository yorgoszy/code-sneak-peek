import React from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isSameMonth, isToday } from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { el } from "date-fns/locale";

interface ProgramData {
  date: string;
  status: string;
  assignmentId: string;
  userName: string;
  assignment: any;
}

interface WeeklyViewProps {
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
  selectedDate: Date | undefined;
  setSelectedDate: (date: Date) => void;
  programDatesWithStatus: ProgramData[];
  realtimeKey: number;
  onUserNameClick: (programData: ProgramData, event: React.MouseEvent) => void;
}

export const WeeklyView: React.FC<WeeklyViewProps> = ({
  currentMonth,
  setCurrentMonth,
  selectedDate,
  setSelectedDate,
  programDatesWithStatus,
  realtimeKey,
  onUserNameClick
}) => {
  const weekStart = startOfWeek(selectedDate || currentMonth, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate || currentMonth, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const handlePreviousWeek = () => {
    const newDate = subWeeks(selectedDate || currentMonth, 1);
    setSelectedDate(newDate);
    setCurrentMonth(newDate);
  };

  const handleNextWeek = () => {
    const newDate = addWeeks(selectedDate || currentMonth, 1);
    setSelectedDate(newDate);
    setCurrentMonth(newDate);
  };

  const getNameColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-[#00ffba] font-semibold';
      case 'missed':
        return 'text-red-500 font-semibold';
      default:
        return 'text-blue-500';
    }
  };

  return (
    <div className="w-full">
      {/* Week Navigation */}
      <div className="flex items-center justify-between mb-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePreviousWeek}
          className="rounded-none"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-base font-semibold">
          {format(weekStart, 'dd', { locale: el })} - {format(weekEnd, 'dd MMMM yyyy', { locale: el })}
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNextWeek}
          className="rounded-none"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* ΠΟΛΥ μικρότερα κελιά */}
      <div className="grid grid-cols-7 gap-[1px] overflow-x-auto md:overflow-x-visible min-w-full" style={{ minWidth: 196 }}>
        {weekDays.map((date) => {
          const dateStr = format(date, 'yyyy-MM-dd');
          const dateProgramsWithStatus = programDatesWithStatus.filter(d => d.date === dateStr);
          const isTodayDate = isToday(date);

          return (
            <div
              key={`weekly-${dateStr}-${realtimeKey}`}
              className={`
                min-h-8 max-h-10 border border-gray-200 rounded-none px-0.5 py-0.5 bg-white
                ${isTodayDate ? 'bg-yellow-100 border-2 border-yellow-400' : ''}
                hover:bg-gray-50 transition-colors
              `}
              style={{ minWidth: 28, maxWidth: 38 }}
            >
              {/* Date Header */}
              <div className={`text-[11px] font-medium mb-0 ${isTodayDate ? 'font-bold text-yellow-600' : ''}`}>
                <div>{format(date, 'dd')}</div>
                <div className="text-[8px]">{format(date, 'EEE', { locale: el })}</div>
              </div>
              
              {/* User Names */}
              <div className="space-y-0">
                {dateProgramsWithStatus.slice(0, 3).map((program, i) => (
                  <div 
                    key={`${program.assignmentId}-${i}-${realtimeKey}`}
                    className={`text-[8px] cursor-pointer hover:underline truncate ${getNameColor(program.status)}`}
                    onClick={(e) => onUserNameClick(program, e)}
                  >
                    {program.userName.split(' ')[0]}
                  </div>
                ))}
                {dateProgramsWithStatus.length > 3 && (
                  <div className="text-[8px] text-gray-500">
                    +{dateProgramsWithStatus.length - 3}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
