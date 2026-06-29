import React from 'react';
import { format, addDays, subDays, isToday } from "date-fns";
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

interface DailyViewProps {
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
  selectedDate: Date | undefined;
  setSelectedDate: (date: Date) => void;
  programDatesWithStatus: ProgramData[];
  realtimeKey: number;
  onUserNameClick: (programData: ProgramData, event: React.MouseEvent) => void;
}

export const DailyView: React.FC<DailyViewProps> = ({
  currentMonth,
  setCurrentMonth,
  selectedDate,
  setSelectedDate,
  programDatesWithStatus,
  realtimeKey,
  onUserNameClick
}) => {
  const currentDate = selectedDate || currentMonth;

  const handlePreviousDay = () => {
    const newDate = subDays(currentDate, 1);
    setSelectedDate(newDate);
    setCurrentMonth(newDate);
  };

  const handleNextDay = () => {
    const newDate = addDays(currentDate, 1);
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

  const dateStr = format(currentDate, 'yyyy-MM-dd');
  const dateProgramsWithStatus = programDatesWithStatus.filter(d => d.date === dateStr);
  const isTodayDate = isToday(currentDate);

  return (
    <div className="w-full">
      {/* Day Navigation */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePreviousDay}
          className="rounded-none"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-xl font-semibold">
          {format(currentDate, 'EEEE, dd MMMM yyyy', { locale: el })}
          {isTodayDate && <span className="ml-2 text-yellow-600">(Σήμερα)</span>}
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNextDay}
          className="rounded-none"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2 min-h-80 sm:min-h-96 px-1 sm:px-0">
        {dateProgramsWithStatus.length === 0 ? (
          <div className="text-center py-10 sm:py-12 text-gray-500 bg-gray-50 rounded-none border-2 border-dashed border-gray-200">
            <div className="text-lg mb-2">Δεν υπάρχουν προγραμματισμένες προπονήσεις</div>
            <div className="text-sm">για αυτή την ημέρα</div>
          </div>
        ) : (
          <div className="space-y-1">
            {dateProgramsWithStatus.map((program, i) => (
              <div
                key={`daily-${program.assignmentId}-${i}-${realtimeKey}`}
                className={`
                  text-sm cursor-pointer hover:underline p-2 rounded-none border-l-4 flex items-center gap-2
                  ${program.status === 'completed' ? 'border-[#00ffba] bg-[#00ffba]/5' : 
                    program.status === 'missed' ? 'border-red-500 bg-red-50' : 
                    'border-blue-500 bg-blue-50'}
                  ${getNameColor(program.status, program.date)}
                `}
                onClick={(e) => onUserNameClick(program, e)}
              >
                <span>{program.userName}</span>
                {program.status === 'completed' && program.rpeScore && (
                  <span className={`text-[10px] text-white px-1.5 py-0.5 rounded-none font-bold ${getRpeColor(program.rpeScore)}`}>
                    RPE {program.rpeScore}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
