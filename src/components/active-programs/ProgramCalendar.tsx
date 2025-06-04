
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek } from "date-fns";
import { CalendarHeader } from './calendar/CalendarHeader';
import { CalendarGrid } from './calendar/CalendarGrid';
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";
import { useWorkoutCompletions } from "@/hooks/useWorkoutCompletions";

interface ProgramCalendarProps {
  programs: EnrichedAssignment[];
  onRefresh?: () => void;
}

export const ProgramCalendar: React.FC<ProgramCalendarProps> = ({ programs, onRefresh }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [allCompletions, setAllCompletions] = useState<any[]>([]);
  const { getWorkoutCompletions } = useWorkoutCompletions();

  console.log('📅 ProgramCalendar rendering with programs:', programs.length);

  useEffect(() => {
    const fetchAllCompletions = async () => {
      if (programs.length === 0) {
        console.log('⚠️ No programs available, skipping completions fetch');
        setAllCompletions([]);
        return;
      }

      console.log('🔄 Fetching completions for programs:', programs.length);
      const completionsData: any[] = [];
      
      for (const program of programs) {
        try {
          console.log('🔍 Fetching completions for program:', program.id);
          const completions = await getWorkoutCompletions(program.id);
          console.log('✅ Completions received:', completions);
          completionsData.push(...completions.map(c => ({ ...c, assignment_id: program.id })));
        } catch (error) {
          console.error('❌ Error fetching completions for program:', program.id, error);
        }
      }
      
      console.log('📊 All completions data:', completionsData);
      setAllCompletions(completionsData);
    };

    fetchAllCompletions();
  }, [programs, getWorkoutCompletions]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  // Ξεκινάμε από την Κυριακή της εβδομάδας που περιέχει την πρώτη μέρα του μήνα
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // 0 = Κυριακή
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  return (
    <Card className="w-full rounded-none h-full flex flex-col">
      <CardHeader className="pb-2 flex-shrink-0">
        <CalendarHeader
          currentDate={currentDate}
          onPreviousMonth={goToPreviousMonth}
          onNextMonth={goToNextMonth}
        />
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-2">
        <div className="h-full overflow-auto">
          <CalendarGrid
            days={days}
            currentDate={currentDate}
            programs={programs}
            allCompletions={allCompletions}
            onRefresh={onRefresh}
          />
          
          {programs.length === 0 && (
            <div className="text-center py-4 text-gray-500 text-sm">
              Δεν υπάρχουν ενεργά προγράμματα
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
