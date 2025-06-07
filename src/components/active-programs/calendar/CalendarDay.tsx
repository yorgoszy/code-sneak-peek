
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

  // Enhanced color function με άμεση ανανέωση
  const getNameColor = (status: string) => {
    console.log(`🎨 CalendarDay: Status for ${dateStr}:`, status);
    switch (status) {
      case 'completed':
        return 'text-[#00ffba] font-semibold';
      case 'missed':
        return 'text-red-500 font-semibold';
      case 'pending':
        return 'text-blue-500';
      case 'scheduled':
        return 'text-blue-500';
      default:
        return 'text-blue-500';
    }
  };

  // Enhanced key με timestamp για force re-render
  const enhancedKey = `${dateStr}-${realtimeKey}-${Date.now()}`;

  return (
    <div
      key={enhancedKey}
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
      
      {/* User Names με enhanced realtime updates */}
      <div className="h-full flex flex-col items-center justify-center space-y-0.5 px-1 pt-4 pb-1">
        {programsForDate.slice(0, 5).map((program, i) => {
          // Enhanced unique key για κάθε user name
          const userKey = `${program.assignmentId}-${i}-${realtimeKey}-${program.status}-${Date.now()}`;
          const colorClass = getNameColor(program.status);
          
          console.log(`👤 CalendarDay: Rendering user ${program.userName} with status ${program.status} and color ${colorClass}`);
          
          return (
            <div 
              key={userKey}
              className={`text-xs cursor-pointer hover:underline truncate w-full text-center ${colorClass}`}
              onClick={(e) => onUserNameClick(program, e)}
            >
              {program.userName.split(' ')[0]}
            </div>
          );
        })}
        {programsForDate.length > 5 && (
          <div className="text-xs text-gray-500">
            +{programsForDate.length - 5}
          </div>
        )}
      </div>
    </div>
  );
};
