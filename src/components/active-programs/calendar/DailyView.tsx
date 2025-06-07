
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-[#00ffba]/10 border-[#00ffba] text-[#00ffba]';
      case 'missed':
        return 'bg-red-100 border-red-500 text-red-600';
      default:
        return 'bg-blue-100 border-blue-500 text-blue-600';
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

      {/* Daily Programs */}
      <div className="space-y-4">
        {dateProgramsWithStatus.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-none border-2 border-dashed border-gray-200">
            <div className="text-lg mb-2">Δεν υπάρχουν προγραμματισμένες προπονήσεις</div>
            <div className="text-sm">για αυτή την ημέρα</div>
          </div>
        ) : (
          <div className="grid gap-3">
            {dateProgramsWithStatus.map((program, i) => (
              <div
                key={`daily-${program.assignmentId}-${i}-${realtimeKey}`}
                className={`
                  p-4 border-2 rounded-none cursor-pointer hover:shadow-md transition-all
                  ${getStatusColor(program.status)}
                `}
                onClick={(e) => onUserNameClick(program, e)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {program.userName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium">{program.userName}</h4>
                      <p className="text-sm opacity-75">{program.assignment.programs?.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`
                      px-3 py-1 rounded-none text-xs font-medium border
                      ${getStatusColor(program.status)}
                    `}>
                      {program.status === 'completed' ? 'Ολοκληρωμένη' :
                       program.status === 'missed' ? 'Χαμένη' : 'Προγραμματισμένη'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
