
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { DayProgramDialog } from "@/components/active-programs/calendar/DayProgramDialog";
import { UserProfileCalendarHeader } from "./daily-program/UserProfileCalendarHeader";
import { UserProfileCalendarEmpty } from "./daily-program/UserProfileCalendarEmpty";
import { UserProfileCalendarContent } from "./daily-program/UserProfileCalendarContent";
import { LoadingState, ErrorState } from "./daily-program/UserProfileCalendarStates";
import { useUserCalendarData } from "./daily-program/hooks/useUserCalendarData";
import { format } from "date-fns";
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface UserProfileDailyProgramProps {
  userProfile: any;
}

export const UserProfileDailyProgram: React.FC<UserProfileDailyProgramProps> = ({ userProfile }) => {
  const [showDebugger, setShowDebugger] = useState(false);
  
  // Dialog states - μόνο το DayProgramDialog
  const [selectedProgram, setSelectedProgram] = useState<EnrichedAssignment | null>(null);
  const [dayProgramOpen, setDayProgramOpen] = useState(false);

  const {
    currentMonth,
    setCurrentMonth,
    selectedDate,
    setSelectedDate,
    realtimeKey,
    userPrograms,
    workoutCompletions,
    programsForSelectedDate,
    getWorkoutStatusForDate,
    handleRefresh,
    handleDelete,
    isLoading,
    error
  } = useUserCalendarData({ userId: userProfile.id });

  // Νέα συνάρτηση για χειρισμό κλικ σε όνομα χρήστη - ανοίγει το DayProgramDialog
  const handleNameClick = (program: any, event: React.MouseEvent) => {
    event.stopPropagation();
    const assignment = userPrograms.find(p => p.id === program.assignmentId);
    if (assignment) {
      setSelectedProgram(assignment);
      // Χρησιμοποιούμε την ημερομηνία από το program object
      const programDate = new Date(program.date);
      setSelectedDate(programDate);
      setDayProgramOpen(true);
    }
  };

  if (isLoading) {
    return <LoadingState userName={userProfile.name} />;
  }

  if (error) {
    return <ErrorState userName={userProfile.name} />;
  }

  if (userPrograms.length === 0) {
    return <UserProfileCalendarEmpty />;
  }

  return (
    <div className="space-y-2 md:space-y-4 lg:space-y-6 h-full">
      <Card className="rounded-none flex-1 min-h-0">
        <UserProfileCalendarHeader
          userName={userProfile.name}
          showDebugger={showDebugger}
          onToggleDebugger={() => setShowDebugger(!showDebugger)}
        />
        <CardContent className="p-2 md:p-4 lg:p-6 h-full">
          <UserProfileCalendarContent
            showDebugger={showDebugger}
            currentMonth={currentMonth}
            setCurrentMonth={setCurrentMonth}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            userPrograms={userPrograms}
            workoutCompletions={workoutCompletions}
            realtimeKey={realtimeKey}
            onNameClick={handleNameClick}
            programsForSelectedDate={programsForSelectedDate}
            onRefresh={handleRefresh}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      {/* Μόνο το DayProgramDialog */}
      <DayProgramDialog
        isOpen={dayProgramOpen}
        onClose={() => setDayProgramOpen(false)}
        program={selectedProgram}
        selectedDate={selectedDate}
        workoutStatus={selectedProgram && selectedDate ? 
          getWorkoutStatusForDate(selectedProgram.id, format(selectedDate, 'yyyy-MM-dd')) : 'scheduled'
        }
        onRefresh={handleRefresh}
      />
    </div>
  );
};
