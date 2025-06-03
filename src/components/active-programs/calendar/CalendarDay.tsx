import React, { useState } from 'react';
import { format, isSameMonth, isToday } from "date-fns";
import { CalendarProgramItem } from './CalendarProgramItem';
import { DayProgramDialog } from './DayProgramDialog';
import { DayAllProgramsDialog } from './DayAllProgramsDialog';
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
  
  const [showAllPrograms, setShowAllPrograms] = useState(false);

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
    
    const completion = allCompletions.find(c => 
      c.assignment_id === program.id && 
      c.scheduled_date === dayString
    );

    console.log('🔍 Found completion:', completion);

    if (completion) {
      console.log('✅ Completion status:', completion.status);
      return completion.status;
    }

    console.log('📝 No completion found, returning scheduled');
    return 'scheduled';
  };

  const handleProgramClick = (program: EnrichedAssignment) => {
    const workoutStatus = getWorkoutStatus(program, dayString);
    setSelectedProgram({
      program,
      date: day,
      status: workoutStatus
    });
  };

  const handleDayClick = () => {
    const dayPrograms = getProgramsForDay(day);
    if (dayPrograms.length > 1) {
      setShowAllPrograms(true);
    } else if (dayPrograms.length === 1) {
      handleProgramClick(dayPrograms[0]);
    }
  };

  const dayPrograms = getProgramsForDay(day);

  // Calculate today's progress (only for today)
  const getTodaysProgress = () => {
    if (!isDayToday || dayPrograms.length === 0) return 0;
    
    const completedPrograms = dayPrograms.filter(program => {
      const workoutStatus = getWorkoutStatus(program, dayString);
      return workoutStatus === 'completed';
    });
    
    return Math.round((completedPrograms.length / dayPrograms.length) * 100);
  };

  const todaysProgress = getTodaysProgress();

  return (
    <>
      <div
        className={`
          min-h-[80px] p-1 border border-gray-200 rounded-none
          ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
          ${isDayToday ? 'ring-2 ring-blue-500' : ''}
        `}
      >
        <div 
          className={`
            text-sm font-medium mb-1 cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded-none
            ${isDayToday ? 'text-blue-600' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
          `}
          onClick={handleDayClick}
        >
          {format(day, 'd')}
          {dayPrograms.length > 1 && (
            <span className="ml-1 text-xs bg-gray-200 text-gray-600 px-1 py-0.5 rounded-none">
              {dayPrograms.length}
            </span>
          )}
        </div>
        
        <div className="space-y-1">
          {dayPrograms.slice(0, 2).map((program, index) => {
            const workoutStatus = getWorkoutStatus(program, dayString);
            
            return (
              <CalendarProgramItem
                key={program.id}
                program={program}
                workoutStatus={workoutStatus}
                allCompletions={allCompletions}
                onClick={() => handleProgramClick(program)}
                showProgress={isDayToday && index === 0}
                progressValue={isDayToday && index === 0 ? todaysProgress : 100}
              />
            );
          })}
          
          {dayPrograms.length > 2 && (
            <div 
              className="text-xs text-gray-500 text-center cursor-pointer hover:text-gray-700"
              onClick={handleDayClick}
            >
              +{dayPrograms.length - 2} ακόμη
            </div>
          )}
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

      <DayAllProgramsDialog
        isOpen={showAllPrograms}
        onClose={() => setShowAllPrograms(false)}
        selectedDate={day}
        programs={programs}
        allCompletions={allCompletions}
        onProgramClick={handleProgramClick}
      />
    </>
  );
};
