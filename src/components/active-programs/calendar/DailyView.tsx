
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
        <h3 className="text-lg md:text-xl font-semibold">
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

      <div className="space-y-2 min-h-80 sm:min-h-96 px-0">
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
                  text-base md:text-sm cursor-pointer hover:underline p-3 rounded-none border-l-4
                  ${program.status === 'completed' ? 'border-[#00ffba] bg-[#00ffba]/5' :
                    program.status === 'missed' ? 'border-red-500 bg-red-50' :
                    'border-blue-500 bg-blue-50'}
                  ${getNameColor(program.status)}
                `}
                onClick={(e) => onUserNameClick(program, e)}
              >
                {program.userName}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

