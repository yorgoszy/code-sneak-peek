
import React, { useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek } from "date-fns";
import { CalendarHeader } from "./CalendarHeader";
import { CalendarWeekDays } from "./CalendarWeekDays";
import { CalendarDay } from "./CalendarDay";
import { CalendarNavigation } from "./CalendarNavigation";
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface CalendarGridProps {
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  activePrograms: EnrichedAssignment[];
  workoutCompletions: any[];
  realtimeKey: number;
  onNameClick: (assignment: EnrichedAssignment) => void;
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
  // Generate calendar days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  // ΚΡΙΤΙΚΟ: Enhanced data processing που συμπεριλαμβάνει status_color
  const programsByDate = useMemo(() => {
    console.log('🔄 CalendarGrid: Processing programs with enhanced status_color support');
    
    const dateMap: Record<string, any[]> = {};

    activePrograms.forEach(assignment => {
      if (!assignment.training_dates) return;

      assignment.training_dates.forEach(dateStr => {
        if (!dateMap[dateStr]) {
          dateMap[dateStr] = [];
        }

        // Βρίσκουμε το workout completion για αυτή την ημερομηνία
        const completion = workoutCompletions.find(c => 
          c.assignment_id === assignment.id && c.scheduled_date === dateStr
        );

        console.log(`📊 CalendarGrid: Assignment ${assignment.id} on ${dateStr}:`, {
          completion_status: completion?.status,
          completion_status_color: completion?.status_color,
          user: assignment.app_users?.name
        });

        dateMap[dateStr].push({
          date: dateStr,
          status: completion?.status || 'scheduled',
          status_color: completion?.status_color || null, // ΚΡΙΤΙΚΟ: Περνάμε το status_color
          assignmentId: assignment.id,
          userName: assignment.app_users?.name || 'Unknown',
          assignment
        });
      });
    });

    return dateMap;
  }, [activePrograms, workoutCompletions, realtimeKey]); // ΚΡΙΤΙΚΟ: Dependency στο realtimeKey

  return (
    <div className="bg-white border border-gray-200 rounded-none">
      <CalendarNavigation 
        currentMonth={currentMonth} 
        setCurrentMonth={setCurrentMonth}
      />
      <CalendarWeekDays />
      
      <div className="grid grid-cols-7">
        {calendarDays.map(day => {
          const dayStr = format(day, 'yyyy-MM-dd');
          const programsForDate = programsByDate[dayStr] || [];
          
          return (
            <CalendarDay
              key={`${dayStr}-${realtimeKey}`} // ΚΡΙΤΙΚΟ: Key με realtimeKey
              date={day}
              currentMonth={currentMonth}
              selectedDate={selectedDate}
              programsForDate={programsForDate}
              realtimeKey={realtimeKey}
              onDateClick={setSelectedDate}
              onUserNameClick={(programData, event) => {
                event.stopPropagation();
                onNameClick(programData.assignment);
              }}
            />
          );
        })}
      </div>
    </div>
  );
};
