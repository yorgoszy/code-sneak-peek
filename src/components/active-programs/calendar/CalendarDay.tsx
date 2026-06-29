import React from 'react';
import { format, isSameMonth, isToday } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
  const dragStateRef = React.useRef<{
    payload: { assignmentId: string; date: string; userName: string };
    startX: number;
    startY: number;
    moved: boolean;
  } | null>(null);

  const emitBubbleDragEnd = React.useCallback(() => {
    const state = dragStateRef.current;
    if (!state) return;
    window.dispatchEvent(new CustomEvent('bubble-drag-end', {
      detail: {
        ...state.payload,
        clientX: state.startX,
        clientY: state.startY,
      }
    }));
    dragStateRef.current = null;
  }, []);

  const startBubbleDrag = React.useCallback((
    payload: { assignmentId: string; date: string; userName: string },
    clientX: number,
    clientY: number
  ) => {
    dragStateRef.current = { payload, startX: clientX, startY: clientY, moved: false };
    window.dispatchEvent(new CustomEvent('bubble-drag-start', { detail: payload }));
  }, []);

  const moveBubbleDrag = React.useCallback((clientX: number, clientY: number) => {
    const state = dragStateRef.current;
    if (!state) return;
    state.startX = clientX;
    state.startY = clientY;
    state.moved = true;
    window.dispatchEvent(new CustomEvent('bubble-drag-move', {
      detail: { ...state.payload, clientX, clientY }
    }));
  }, []);

  React.useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => moveBubbleDrag(e.clientX, e.clientY);
    const handlePointerUp = () => emitBubbleDragEnd();
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [emitBubbleDragEnd, moveBubbleDrag]);

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
        h-14 sm:h-16 md:h-20 lg:h-22
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
      <div className="h-full flex flex-col items-start justify-center space-y-0 px-0.5 sm:px-1 pt-3 pb-0.5 w-full">
        {programsForDate.slice(0, 3).map((program, i) => {
          const userKey = `${program.assignmentId}-${i}-${realtimeKey}-${program.status}-${Date.now()}`;
          const colorClass = getNameColor(program.status, program.date);
          return (
            <div 
              key={userKey}
              onPointerDown={(e) => {
                e.stopPropagation();
                const payload = { assignmentId: program.assignmentId, date: program.date, userName: program.userName };
                startBubbleDrag(payload, e.clientX, e.clientY);
              }}
              className={`text-[10px] leading-tight cursor-grab active:cursor-grabbing hover:underline truncate w-full text-left flex items-center gap-0.5 select-none touch-none ${colorClass}`}
              onClick={(e) => {
                e.stopPropagation();
                if (dragStateRef.current?.moved) {
                  e.preventDefault();
                  return;
                }
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
        {programsForDate.length > 3 && (
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="text-[10px] text-gray-500 hover:text-black hover:underline text-left w-full leading-tight cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              >
                +{programsForDate.length - 3}
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-56 p-2 rounded-none"
              align="start"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-xs font-semibold mb-2 text-gray-700">
                Όλες οι προπονήσεις ({programsForDate.length})
              </div>
              <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
                {programsForDate.map((program, i) => {
                  const colorClass = getNameColor(program.status, program.date);
                  return (
                    <button
                      type="button"
                      key={`pop-${program.assignmentId}-${i}`}
                      className={`text-xs text-left px-2 py-1 hover:bg-gray-100 flex items-center justify-between gap-2 ${colorClass}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onUserNameClick(program, e);
                      }}
                    >
                      <span className="truncate">{program.userName}</span>
                      {program.status === 'completed' && program.rpeScore && (
                        <span className={`text-[10px] text-white px-1 rounded-none ${getRpeColor(program.rpeScore)}`}>
                          {program.rpeScore}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  );
};
