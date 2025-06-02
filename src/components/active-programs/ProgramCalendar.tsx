
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { CalendarHeader } from './calendar/CalendarHeader';
import { CalendarGrid } from './calendar/CalendarGrid';
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";
import { useWorkoutCompletions } from "@/hooks/useWorkoutCompletions";

interface ProgramCalendarProps {
  programs: EnrichedAssignment[];
}

export const ProgramCalendar: React.FC<ProgramCalendarProps> = ({ programs }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [allCompletions, setAllCompletions] = useState<any[]>([]);
  const { getWorkoutCompletions } = useWorkoutCompletions();

  console.log('📅 ProgramCalendar rendering with programs:', programs.length);

  useEffect(() => {
    const fetchAllCompletions = async () => {
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

    if (programs.length > 0) {
      fetchAllCompletions();
    }
  }, [programs, getWorkoutCompletions]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  return (
    <Card className="w-full rounded-none">
      <CardHeader>
        <CalendarHeader
          currentDate={currentDate}
          onPreviousMonth={goToPreviousMonth}
          onNextMonth={goToNextMonth}
        />
      </CardHeader>
      <CardContent>
        <CalendarGrid
          days={days}
          currentDate={currentDate}
          programs={programs}
          allCompletions={allCompletions}
        />
        
        {programs.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Δεν υπάρχουν ενεργά προγράμματα
          </div>
        )}
      </CardContent>
    </Card>
  );
};
