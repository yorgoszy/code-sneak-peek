
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
  isMobileView?: boolean;
}

export const CalendarDay: React.FC<CalendarDayProps> = ({
  date,
  currentMonth,
  selectedDate,
  programsForDate,
  realtimeKey,
  onDateClick,
  onUserNameClick,
  onDayNumberClick,
  isMobileView = false,
}) => {
  const dateStr = format(date, 'yyyy-MM-dd');
  const isCurrentMonth = isSameMonth(date, currentMonth);
  const isSelected = selectedDate && format(selectedDate, 'yyyy-MM-dd') === dateStr;
  const isTodayDate = isToday(date);

  const getNameColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-[#00ffba] font-semibold'; // Πράσινο για ολοκληρωμένες
      case 'missed':
        return 'text-red-500 font-semibold';
      case 'pending':
      case 'scheduled':
      default:
        return 'text-blue-500';
    }
  };

  // Σε κινητό/μικρή οθόνη: Πιο μαζεμένη εμφάνιση
  if (isMobileView) {
    return (
      <div
        className={`
          flex flex-col border-b border-gray-200 min-h-[54px]
          bg-white px-3 py-2 justify-center
          ${isSelected ? 'bg-[#00ffba] text-black' : ''}
          ${isTodayDate && !isSelected ? 'bg-yellow-100 border-yellow-400 border-l-4' : ''}
          transition-colors
        `}
        onClick={() => onDateClick(date)}
        style={{width: "100%"}}
      >
        {/* Day header row */}
        <div className="flex items-center gap-2">
          <div 
            className={`text-lg font-semibold ${isTodayDate ? 'text-yellow-600 underline' : ''} cursor-pointer select-none`}
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
            <span className="ml-2 text-xs text-gray-400">{isTodayDate ? "(Σήμερα)" : null}</span>
          </div>
          <div className="text-sm">
            {/* Αν δεν είναι από αυτόν το μήνα, άχρωμο */}
            {!isCurrentMonth && <span className="text-gray-300">Εκτός μήνα</span>}
          </div>
        </div>
        {/* Προγράμματα */}
        <div className="flex flex-wrap gap-1 mt-1">
          {programsForDate.map((program, i) => (
            <div
              key={`${program.assignmentId}-${i}-${realtimeKey}-${program.status}`}
              className={`
                text-xs px-2 py-0.5 rounded 
                cursor-pointer hover:underline bg-gray-100
                ${getNameColor(program.status)}
              `}
              onClick={e => onUserNameClick(program, e)}
            >
              {program.userName.split(' ')[0]}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Enhanced key με timestamp για force re-render
  const enhancedKey = `${dateStr}-${realtimeKey}-${Date.now()}`;

  return (
    <div
      key={enhancedKey}
      className={`
        min-w-[64px] h-20 md:h-24 border-r border-b border-gray-200 last:border-r-0 cursor-pointer relative
        ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'}
        ${isSelected ? 'bg-[#00ffba] text-black' : ''}
        ${isTodayDate && !isSelected ? 'bg-yellow-100 border-2 border-yellow-400' : ''}
        hover:bg-gray-50 transition-colors
      `}
      onClick={() => onDateClick(date)}
      style={{
        flex: '1 0 64px', // για μικρότερα κινητά
        maxWidth: '100px'
      }}
    >
      {/* Date Number (κλικ μόνο στον αριθμό!) */}
      <div 
        className={`
          absolute top-1 left-1 text-sm font-medium cursor-pointer z-10
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
      
      {/* User Names με enhanced realtime updates */}
      <div className="h-full flex flex-col items-center justify-center space-y-0.5 px-1 pt-4 pb-1">
        {programsForDate.slice(0, 5).map((program, i) => {
          // Enhanced unique key για κάθε user name
          const userKey = `${program.assignmentId}-${i}-${realtimeKey}-${program.status}-${Date.now()}`;
          const colorClass = getNameColor(program.status);
          // Αν θέλεις console.log μόνο στη desktop εμπειρία:
          // console.log(`👤 CalendarDay: Rendering user ${program.userName} with status ${program.status} and color ${colorClass}`);
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
