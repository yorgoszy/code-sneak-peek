
import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, format } from "date-fns";
import { CalendarHeader } from './calendar/CalendarHeader';
import { CalendarCell } from './calendar/CalendarCell';
import { ProgramSelectionDialog } from './calendar/ProgramSelectionDialog';
import { EmbeddedProgramDialog } from './EmbeddedProgramDialog';
import { useUserProgramsData } from './calendar/hooks/useUserProgramsData';
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface UserProfileCalendarProps {
  user: any;
}

export const UserProfileCalendar: React.FC<UserProfileCalendarProps> = ({ user }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedProgram, setSelectedProgram] = useState<{
    program: EnrichedAssignment;
    date: Date;
    status: string;
  } | null>(null);
  const [showProgramSelection, setShowProgramSelection] = useState<{
    programs: EnrichedAssignment[];
    date: Date;
  } | null>(null);

  const { programs, allCompletions, loading, getWorkoutStatus, handleRefresh } = useUserProgramsData(user);

  console.log('📅 UserProfileCalendar rendering for user:', user?.id);

  const handleDayClick = (day: Date) => {
    const dayString = format(day, 'yyyy-MM-dd');
    const dayPrograms = programs.filter(program => {
      if (!program.training_dates) return false;
      return program.training_dates.some((dateStr: string) => {
        const programDate = new Date(dateStr);
        return programDate.toDateString() === day.toDateString();
      });
    });

    if (dayPrograms.length === 0) {
      return; // Δεν υπάρχουν προγράμματα για αυτή την ημέρα
    } else if (dayPrograms.length === 1) {
      // Ένα πρόγραμμα - άνοιξε απευθείας
      const workoutStatus = getWorkoutStatus(dayPrograms[0], dayString);
      setSelectedProgram({
        program: dayPrograms[0],
        date: day,
        status: workoutStatus
      });
    } else {
      // Πολλαπλά προγράμματα - δείξε επιλογή
      setShowProgramSelection({
        programs: dayPrograms,
        date: day
      });
    }
  };

  const handleProgramSelect = (program: EnrichedAssignment) => {
    if (!showProgramSelection) return;
    
    const dayString = format(showProgramSelection.date, 'yyyy-MM-dd');
    const workoutStatus = getWorkoutStatus(program, dayString);
    
    setSelectedProgram({
      program,
      date: showProgramSelection.date,
      status: workoutStatus
    });
    setShowProgramSelection(null);
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  if (loading) {
    return (
      <Card className="w-full h-full rounded-none border-0 bg-transparent">
        <CardContent className="p-1">
          <div className="text-center py-4 text-gray-500 text-xs">
            Φόρτωση ημερολογίου...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="w-full h-full rounded-none border-0 bg-transparent flex flex-col text-xs">
        <CardHeader className="p-1 pb-0">
          <CalendarHeader
            currentDate={currentDate}
            onPreviousMonth={goToPreviousMonth}
            onNextMonth={goToNextMonth}
          />
        </CardHeader>
        <CardContent className="p-1 pt-0 flex-1 overflow-hidden">
          <div className="h-full flex flex-col">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-px mb-1">
              {['Δ', 'Τ', 'Τ', 'Π', 'Π', 'Σ', 'Κ'].map((day) => (
                <div key={day} className="text-center font-medium text-gray-400 text-xs py-1">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-px flex-1">
              {days.map((day) => (
                <CalendarCell
                  key={day.toISOString()}
                  day={day}
                  currentDate={currentDate}
                  programs={programs}
                  allCompletions={allCompletions}
                  onDayClick={handleDayClick}
                />
              ))}
            </div>
          </div>
          
          {programs.length === 0 && (
            <div className="text-center py-2 text-gray-500 text-xs">
              Δεν υπάρχουν προγράμματα
            </div>
          )}
        </CardContent>
      </Card>

      {/* Program Selection Dialog */}
      <ProgramSelectionDialog
        isOpen={!!showProgramSelection}
        programs={showProgramSelection?.programs || []}
        date={showProgramSelection?.date || new Date()}
        allCompletions={allCompletions}
        onClose={() => setShowProgramSelection(null)}
        onProgramSelect={handleProgramSelect}
      />

      {/* Embedded Program Dialog */}
      {selectedProgram && (
        <EmbeddedProgramDialog
          isOpen={!!selectedProgram}
          onClose={() => setSelectedProgram(null)}
          program={selectedProgram.program}
          selectedDate={selectedProgram.date}
          workoutStatus={selectedProgram.status}
          onRefresh={handleRefresh}
        />
      )}
    </>
  );
};
