
import React from 'react';
import { format, isSameMonth, isToday } from "date-fns";

interface ProgramData {
  date: string;
  status: string;
  assignmentId: string;
  userName: string;
  assignment: any;
}

interface CalendarDayProps {
  date: Date;
  currentMonth: Date;
  selectedDate: Date | undefined;
  programsForDate: ProgramData[];
  realtimeKey: number;
  onDateClick: (date: Date) => void;
  onUserNameClick: (programData: ProgramData, event: React.MouseEvent) => void;
}

export const CalendarDay: React.FC<CalendarDayProps> = ({
  date,
  currentMonth,
  selectedDate,
  programsForDate,
  realtimeKey,
  onDateClick,
  onUserNameClick
}) => {
  const dateStr = format(date, 'yyyy-MM-dd');
  const isCurrentMonth = isSameMonth(date, currentMonth);
  const isSelected = selectedDate && format(selectedDate, 'yyyy-MM-dd') === dateStr;
  const isTodayDate = isToday(date);

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
    <div
      key={`${dateStr}-${realtimeKey}`}
      className={`
        h-20 border-r border-b border-gray-200 last:border-r-0 cursor-pointer relative
        ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'}
        ${isSelected ? 'bg-[#00ffba] text-black' : ''}
        ${isTodayDate && !isSelected ? 'bg-yellow-100 border-2 border-yellow-400' : ''}
        hover:bg-gray-50 transition-colors
      `}
      onClick={() => onDateClick(date)}
    >
      {/* Date Number */}
      <div 
        className={`
          absolute top-1 left-1 text-sm font-medium
          ${isTodayDate ? 'font-bold text-yellow-600' : ''}
        `}
      >
        {date.getDate()}
      </div>
      
      {/* User Names */}
      <div className="h-full flex flex-col items-center justify-center space-y-0.5 px-1 pt-4 pb-1">
        {programsForDate.slice(0, 5).map((program, i) => (
          <div 
            key={`${program.assignmentId}-${i}-${realtimeKey}`}
            className={`text-xs cursor-pointer hover:underline truncate w-full text-center ${getNameColor(program.status)}`}
            onClick={(e) => onUserNameClick(program, e)}
          >
            {program.userName.split(' ')[0]}
          </div>
        ))}
        {programsForDate.length > 5 && (
          <div className="text-xs text-gray-500">
            +{programsForDate.length - 5}
          </div>
        )}
      </div>
    </div>
  );
};
