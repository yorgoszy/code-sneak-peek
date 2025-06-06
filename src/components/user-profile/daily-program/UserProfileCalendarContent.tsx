
import React from 'react';
import { CalendarGrid } from "@/components/active-programs/calendar/CalendarGrid";
import { ProgramsForDateCard } from "@/components/active-programs/calendar/ProgramsForDateCard";
import { DatabaseDebugger } from "@/components/debug/DatabaseDebugger";
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface UserProfileCalendarContentProps {
  showDebugger: boolean;
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
  selectedDate: Date | undefined;
  setSelectedDate: (date: Date) => void;
  userPrograms: EnrichedAssignment[];
  workoutCompletions: any[];
  realtimeKey: number;
  onNameClick: (program: any, event: React.MouseEvent) => void;
  programsForSelectedDate: EnrichedAssignment[];
  onRefresh: () => void;
  onDelete: (assignmentId: string) => void;
}

export const UserProfileCalendarContent: React.FC<UserProfileCalendarContentProps> = ({
  showDebugger,
  currentMonth,
  setCurrentMonth,
  selectedDate,
  setSelectedDate,
  userPrograms,
  workoutCompletions,
  realtimeKey,
  onNameClick,
  programsForSelectedDate,
  onRefresh,
  onDelete
}) => {
  return (
    <>
      {showDebugger && <DatabaseDebugger />}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 md:gap-4 lg:gap-6 h-full">
        <div className="lg:col-span-2 min-h-0">
          <CalendarGrid
            currentMonth={currentMonth}
            setCurrentMonth={setCurrentMonth}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            activePrograms={userPrograms}
            workoutCompletions={workoutCompletions}
            realtimeKey={realtimeKey}
            onNameClick={onNameClick}
          />
        </div>
        
        <div className="lg:col-span-1 space-y-2 md:space-y-4 hidden lg:block">
          <ProgramsForDateCard
            selectedDate={selectedDate}
            programsForSelectedDate={programsForSelectedDate}
            onRefresh={onRefresh}
            onDelete={onDelete}
          />
        </div>
      </div>
    </>
  );
};
