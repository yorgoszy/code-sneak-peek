
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
  rpeScore?: number | null;
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
        // Αν έχει περάσει η ημερομηνία και δεν έχει ολοκληρωθεί → κόκκινο
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
    <div className="w-full">
      {/* Week Navigation - Smaller on mobile */}
      <div className="flex items-center justify-between mb-2 md:mb-4 px-1">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePreviousWeek}
          className="rounded-none h-8 w-8 p-0 md:h-auto md:w-auto md:p-2"
        >
          <ChevronLeft className="h-3 w-3 md:h-4 md:w-4" />
        </Button>
        <h3 className="text-sm md:text-lg font-semibold truncate px-2 text-center">
          {format(weekStart, 'dd', { locale: el })} - {format(weekEnd, 'dd MMMM yyyy', { locale: el })}
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNextWeek}
          className="rounded-none h-8 w-8 p-0 md:h-auto md:w-auto md:p-2"
        >
          <ChevronRight className="h-3 w-3 md:h-4 md:w-4" />
        </Button>
      </div>

      {/* Responsive horizontal grid - much smaller on mobile */}
      <div className="grid grid-cols-7 gap-1 md:gap-2 overflow-x-auto md:overflow-x-visible min-w-full">
        {weekDays.map((date) => {
          const dateStr = format(date, 'yyyy-MM-dd');
          const dateProgramsWithStatus = programDatesWithStatus.filter(d => d.date === dateStr);
          const isTodayDate = isToday(date);

          return (
            <div
              key={`weekly-${dateStr}-${realtimeKey}`}
              className={`
                min-h-20 md:min-h-32 border border-gray-200 rounded-none p-1 md:p-2 bg-white
                ${isTodayDate ? 'bg-yellow-100 border-2 border-yellow-400' : ''}
                hover:bg-gray-50 transition-colors
              `}
            >
              {/* Date Header - Smaller on mobile */}
              <div className={`text-xs md:text-sm font-medium mb-1 md:mb-2 ${isTodayDate ? 'font-bold text-yellow-600' : ''}`}>
                <div className="text-center">{format(date, 'dd')}</div>
                <div className="text-xs text-center truncate">{format(date, 'EEE', { locale: el })}</div>
              </div>
              
              {/* User Names - Much smaller on mobile */}
              <div className="space-y-0.5 md:space-y-1">
                {dateProgramsWithStatus.slice(0, 6).map((program, i) => (
                  <div 
                    key={`${program.assignmentId}-${i}-${realtimeKey}`}
                    className={`text-xs cursor-pointer hover:underline flex items-center gap-0.5 ${getNameColor(program.status, program.date)}`}
                    onClick={(e) => onUserNameClick(program, e)}
                    style={{ fontSize: '10px', lineHeight: '12px' }}
                  >
                    <span className="truncate">{program.userName.split(' ')[0]}</span>
                    {program.status === 'completed' && program.rpeScore && (
                      <span className={`text-[8px] text-white px-0.5 rounded-none font-bold ${getRpeColor(program.rpeScore)} flex-shrink-0`}>
                        {program.rpeScore}
                      </span>
                    )}
                  </div>
                ))}
                {dateProgramsWithStatus.length > 6 && (
                  <div className="text-xs text-gray-500" style={{ fontSize: '10px' }}>
                    +{dateProgramsWithStatus.length - 6}
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
