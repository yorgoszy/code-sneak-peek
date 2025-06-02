
import React, { useState } from 'react';
import { format, isSameMonth, isToday } from "date-fns";
import { CalendarProgramItem } from './CalendarProgramItem';
import { DayProgramDialog } from './DayProgramDialog';
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface CalendarDayProps {
  day: Date;
  currentDate: Date;
  programs: EnrichedAssignment[];
  allCompletions: any[];
  onRefresh?: () => void;
}

export const CalendarDay: React.FC<CalendarDayProps> = ({
  day,
  currentDate,
  programs,
  allCompletions,
  onRefresh
}) => {
  const [selectedProgram, setSelectedProgram] = useState<{
    program: EnrichedAssignment;
    date: Date;
    status: string;
  } | null>(null);

  const isCurrentMonth = isSameMonth(day, currentDate);
  const isDayToday = isToday(day);
  const dayString = format(day, 'yyyy-MM-dd');

  const getProgramsForDay = (day: Date) => {
    const dayString = format(day, 'yyyy-MM-dd');
    
    console.log('🔍 Checking programs for day:', dayString);
    
    const dayPrograms = programs.filter(program => {
      if (program.training_dates && Array.isArray(program.training_dates)) {
        const isTrainingDate = program.training_dates.includes(dayString);
        console.log(`📊 Program ${program.id} - Training dates:`, program.training_dates, 'Checking:', dayString, 'Match:', isTrainingDate);
        return isTrainingDate;
      }
      
      console.log('⚠️ No training_dates data for program:', program.id);
      return false;
    });
    
    console.log(`📅 Programs for ${dayString}:`, dayPrograms.length);
    return dayPrograms;
  };

  const getWorkoutStatus = (program: EnrichedAssignment, dayString: string) => {
    console.log('🔍 Getting workout status for program:', program.id, 'day:', dayString);
    console.log('🔍 Available completions:', allCompletions.filter(c => c.assignment_id === program.id));
    
    // Ελέγχουμε αν υπάρχει completion για αυτή την ημέρα και assignment
    const completion = allCompletions.find(c => 
      c.assignment_id === program.id && 
      c.scheduled_date === dayString
    );

    console.log('🔍 Found completion:', completion);

    if (completion) {
      console.log('✅ Completion status:', completion.status);
      return completion.status; // 'completed', 'missed', 'makeup'
    }

    console.log('📝 No completion found, returning scheduled');
    return 'scheduled'; // Προγραμματισμένη αλλά όχι ολοκληρωμένη
  };

  const handleProgramClick = (program: EnrichedAssignment) => {
    const workoutStatus = getWorkoutStatus(program, dayString);
    setSelectedProgram({
      program,
      date: day,
      status: workoutStatus
    });
  };

  const dayPrograms = getProgramsForDay(day);

  return (
    <>
      <div
        className={`
          min-h-[80px] p-1 border border-gray-200 rounded-none
          ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
          ${isDayToday ? 'ring-2 ring-blue-500' : ''}
        `}
      >
        <div className={`
          text-sm font-medium mb-1
          ${isDayToday ? 'text-blue-600' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
        `}>
          {format(day, 'd')}
        </div>
        
        <div className="space-y-1">
          {dayPrograms.map((program) => {
            const workoutStatus = getWorkoutStatus(program, dayString);
            
            return (
              <CalendarProgramItem
                key={program.id}
                program={program}
                workoutStatus={workoutStatus}
                allCompletions={allCompletions}
                onClick={() => handleProgramClick(program)}
              />
            );
          })}
        </div>
      </div>

      {selectedProgram && (
        <DayProgramDialog
          isOpen={!!selectedProgram}
          onClose={() => setSelectedProgram(null)}
          program={selectedProgram.program}
          selectedDate={selectedProgram.date}
          workoutStatus={selectedProgram.status}
          onRefresh={onRefresh}
        />
      )}
    </>
  );
};
