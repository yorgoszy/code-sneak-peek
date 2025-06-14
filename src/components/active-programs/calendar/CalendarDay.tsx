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

  const getNameColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-[#00ffba] font-semibold';
      case 'missed':
        return 'text-red-500 font-semibold';
      case 'pending':
      case 'scheduled':
      default:
        return 'text-blue-500';
    }
  };

  // Ακόμη μικρότερο! - πλάτος όσο πάει, ελάχιστο ύψος και compact στοίχιση
  const enhancedKey = `${dateStr}-${realtimeKey}-${Date.now()}`;
  return (
    <div
      key={enhancedKey}
      className={`
        min-w-[28px] max-w-[38px] h-8 flex flex-col items-stretch justify-between
        border-r border-b border-gray-200 last:border-r-0 cursor-pointer relative
        ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'}
        ${isSelected ? 'bg-[#00ffba] text-black' : ''}
        ${isTodayDate && !isSelected ? 'bg-yellow-100 border-2 border-yellow-400' : ''}
        hover:bg-gray-50 transition-colors
        rounded-none
      `}
      onClick={() => onDateClick(date)}
      style={{
        flex: '1 0 28px',
        maxWidth: '38px',
        minWidth: '28px',
        height: '32px',
      }}
    >
      {/* Date Number (κλικ μόνο στον αριθμό!) */}
      <div 
        className={`
          absolute top-0.5 left-0.5 text-[11px] font-medium cursor-pointer z-10
          ${isTodayDate ? 'font-bold text-yellow-600' : ''}
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
      <div className="h-full flex flex-col items-center justify-center space-y-0 px-0.5 pt-3 pb-0">
        {programsForDate.slice(0, 3).map((program, i) => {
          const userKey = `${program.assignmentId}-${i}-${realtimeKey}-${program.status}-${Date.now()}`;
          const colorClass = getNameColor(program.status);
          return (
            <div 
              key={userKey}
              className={`text-[8px] cursor-pointer hover:underline truncate w-full text-center ${colorClass}`}
              onClick={(e) => onUserNameClick(program, e)}
            >
              {program.userName.split(' ')[0]}
            </div>
          );
        })}
        {programsForDate.length > 3 && (
          <div className="text-[8px] text-gray-500">
            +{programsForDate.length - 3}
          </div>
        )}
      </div>
    </div>
  );
};
