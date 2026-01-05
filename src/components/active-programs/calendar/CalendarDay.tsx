import React from 'react';
import { format, isSameMonth, isToday } from "date-fns";

interface ProgramData {
  date: string;
  status: string;
  assignmentId: string;
  userName: string;
  assignment: any;
  rpeScore?: number;
}

interface CalendarDayProps {
  date: Date;
  currentMonth: Date;
  selectedDate: Date | undefined;
  programsForDate: ProgramData[];
  realtimeKey: number;
  onDateClick: (date: Date) => void;
  onUserNameClick: (programData: ProgramData, event: React.MouseEvent) => void;
  onDayNumberClick?: (date: Date) => void;
}

export const CalendarDay: React.FC<CalendarDayProps> = ({
  date,
  currentMonth,
  selectedDate,
  programsForDate,
  realtimeKey,
  onDateClick,
  onUserNameClick,
  onDayNumberClick
}) => {
  const dateStr = format(date, 'yyyy-MM-dd');
  const isCurrentMonth = isSameMonth(date, currentMonth);
  const isSelected = selectedDate && format(selectedDate, 'yyyy-MM-dd') === dateStr;
  const isTodayDate = isToday(date);

  const getNameColor = (status: string, workoutDate: string) => {
    const today = new Date();
    const workoutDateObj = new Date(workoutDate);
    const isPast = workoutDateObj < new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    switch (status) {
      case 'completed':
        return 'text-[#00ffba] font-semibold';
      case 'missed':
        return 'text-red-500 font-semibold';
      case 'pending':
      case 'scheduled':
        return isPast ? 'text-red-500 font-semibold' : 'text-blue-500';
      default:
        return isPast ? 'text-red-500 font-semibold' : 'text-blue-500';
    }
  };

  const getRpeColor = (rpe: number) => {
    if (rpe <= 6) return 'bg-green-500';
    if (rpe <= 8) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div
      key={dateStr}
      className={
        `
        min-w-0
        h-16 sm:h-20 md:h-24 lg:h-28
        flex flex-col relative items-start
        border-b border-gray-200
        ${isTodayDate && !isSelected ? 'bg-yellow-100 border-2 border-yellow-400' : ''}
        ${isSelected ? 'bg-[#ededed] text-black' : (isCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400')}
        `
      }
      onClick={() => onDateClick(date)}
    >
      {/* Date Number */}
      <div 
        className={`
          absolute top-0.5 left-1 text-xs sm:text-sm font-medium cursor-pointer z-10
          ${isTodayDate && !isSelected ? 'font-bold text-yellow-600' : ''}
        `}
        onClick={(e) => {
          e.stopPropagation();
          if (onDayNumberClick) {
            onDayNumberClick(date);
          } else {
            onDateClick(date);
          }
        }}
        title="Μετάβαση στην ημερήσια προβολή"
      >
        {date.getDate()}
      </div>
      {/* User Names */}
      <div className="h-full flex flex-col items-start justify-center space-y-0.5 px-0.5 sm:px-1 pt-3 sm:pt-4 pb-1 w-full">
        {programsForDate.slice(0, 4).map((program, i) => {
          const userKey = `${program.assignmentId}-${i}-${realtimeKey}-${program.status}-${Date.now()}`;
          const colorClass = getNameColor(program.status, program.date);
          return (
            <div 
              key={userKey}
              className={`text-xs cursor-pointer hover:underline truncate w-full text-left flex items-center gap-1 py-1 ${colorClass}`}
              onClick={(e) => {
                e.stopPropagation();
                onUserNameClick(program, e);
              }}
            >
              <span className="truncate">{program.userName.split(' ')[0]}</span>
              {program.status === 'completed' && program.rpeScore && (
                <span className={`text-[10px] text-white px-1 rounded-none ${getRpeColor(program.rpeScore)}`}>
                  {program.rpeScore}
                </span>
              )}
            </div>
          );
        })}
        {programsForDate.length > 4 && (
          <div className="text-xs text-gray-500 text-left w-full">
            +{programsForDate.length - 4}
          </div>
        )}
      </div>
    </div>
  );
};
