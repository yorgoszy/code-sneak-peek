
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, addMonths, subMonths, startOfWeek, endOfWeek, isToday } from "date-fns";
import { el } from "date-fns/locale";
import { DayAllProgramsDialog } from './DayAllProgramsDialog';
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface CalendarGridProps {
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
  selectedDate: Date | undefined;
  setSelectedDate: (date: Date) => void;
  activePrograms: EnrichedAssignment[];
  workoutCompletions: any[];
  realtimeKey: number;
  onNameClick: (program: any, event: React.MouseEvent) => void;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  currentMonth,
  setCurrentMonth,
  selectedDate,
  setSelectedDate,
  activePrograms,
  workoutCompletions,
  realtimeKey,
  onNameClick
}) => {
  const [dayDialogOpen, setDayDialogOpen] = useState(false);
  const [selectedDialogDate, setSelectedDialogDate] = useState<Date | null>(null);

  // Δημιουργούμε μια λίστα με όλες τις ημερομηνίες που έχουν προγράμματα και τα statuses τους
  const programDatesWithStatus = activePrograms.reduce((dates: any[], assignment) => {
    if (assignment.training_dates && assignment.app_users) {
      const assignmentCompletions = workoutCompletions.filter(c => c.assignment_id === assignment.id);
      
      assignment.training_dates.forEach(dateStr => {
        const completion = assignmentCompletions.find(c => c.scheduled_date === dateStr);
        dates.push({
          date: dateStr,
          status: completion?.status || 'scheduled',
          assignmentId: assignment.id,
          userName: assignment.app_users.name || 'Άγνωστος',
          assignment: assignment
        });
      });
    }
    return dates;
  }, []);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weekDays = ['Δε', 'Τρ', 'Τε', 'Πε', 'Πα', 'Σα', 'Κυ'];

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleDateNumberClick = (date: Date, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedDialogDate(date);
    setDayDialogOpen(true);
  };

  const handleProgramClick = (program: EnrichedAssignment) => {
    setDayDialogOpen(false);
    // Μπορούμε να προσθέσουμε εδώ άλλη λογική αν χρειάζεται
    console.log('Program clicked:', program);
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

  return (
    <>
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="text-lg">Ημερολόγιο Προπονήσεων</CardTitle>
          <div className="text-xs text-gray-500 space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Προγραμματισμένες</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#00ffba] rounded-full"></div>
              <span>Ολοκληρωμένες</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span>Χαμένες</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-300 rounded-none border border-yellow-600"></div>
              <span>Σήμερα</span>
            </div>
            <div className="text-xs text-blue-600 font-medium">
              Κλικ στον αριθμό της ημέρας για όλα τα προγράμματα
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="rounded-none"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h3 className="text-lg font-semibold">
                {format(currentMonth, 'MMMM yyyy', { locale: el })}
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="rounded-none"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 border-b border-gray-200">
              {weekDays.map((day) => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-600 border-r border-gray-200 last:border-r-0">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 border border-gray-200">
              {days.map((date) => {
                const dateStr = format(date, 'yyyy-MM-dd');
                const dateProgramsWithStatus = programDatesWithStatus.filter(d => d.date === dateStr);
                const isCurrentMonth = isSameMonth(date, currentMonth);
                const isSelected = selectedDate && format(selectedDate, 'yyyy-MM-dd') === dateStr;
                const isTodayDate = isToday(date);

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
                    onClick={() => handleDateClick(date)}
                  >
                    {/* Date Number - Clickable για να ανοίξει το dialog */}
                    <div 
                      className={`
                        absolute top-1 left-1 text-sm font-medium cursor-pointer hover:bg-blue-100 px-1 rounded
                        ${isTodayDate ? 'font-bold text-yellow-600' : ''}
                        ${dateProgramsWithStatus.length > 0 ? 'text-blue-600 hover:text-blue-800' : ''}
                      `}
                      onClick={(e) => handleDateNumberClick(date, e)}
                    >
                      {date.getDate()}
                    </div>
                    
                    {/* User Names */}
                    <div className="h-full flex flex-col items-center justify-center space-y-0.5 px-1 pt-4 pb-1">
                      {dateProgramsWithStatus.slice(0, 5).map((program, i) => (
                        <div 
                          key={`${program.assignmentId}-${i}-${realtimeKey}`}
                          className={`text-xs cursor-pointer hover:underline truncate w-full text-center ${getNameColor(program.status)}`}
                          onClick={(e) => onNameClick(program, e)}
                        >
                          {program.userName.split(' ')[0]}
                        </div>
                      ))}
                      {dateProgramsWithStatus.length > 5 && (
                        <div className="text-xs text-gray-500">
                          +{dateProgramsWithStatus.length - 5}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog για εμφάνιση όλων των προγραμμάτων της ημέρας */}
      <DayAllProgramsDialog
        isOpen={dayDialogOpen}
        onClose={() => setDayDialogOpen(false)}
        selectedDate={selectedDialogDate}
        programs={activePrograms}
        allCompletions={workoutCompletions}
        onProgramClick={handleProgramClick}
      />
    </>
  );
};
