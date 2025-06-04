
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface QuarterCalendarViewProps {
  programs: EnrichedAssignment[];
  allCompletions: any[];
  onDayClick?: (date: Date, dayPrograms: EnrichedAssignment[]) => void;
}

export const QuarterCalendarView: React.FC<QuarterCalendarViewProps> = ({
  programs,
  allCompletions,
  onDayClick
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const getProgramsForDay = (day: Date) => {
    const dayString = format(day, 'yyyy-MM-dd');
    return programs.filter(program => {
      if (program.training_dates && Array.isArray(program.training_dates)) {
        return program.training_dates.includes(dayString);
      }
      return false;
    });
  };

  const getWorkoutStatus = (program: EnrichedAssignment, dayString: string) => {
    const completion = allCompletions.find(c => 
      c.assignment_id === program.id && 
      c.scheduled_date === dayString
    );
    return completion ? completion.status : 'scheduled';
  };

  const handleDayClick = (day: Date) => {
    const dayPrograms = getProgramsForDay(day);
    if (onDayClick) {
      onDayClick(day, dayPrograms);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-2 px-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={goToPreviousMonth}
          className="h-6 w-6 p-0 rounded-none"
        >
          <ChevronLeft className="h-3 w-3" />
        </Button>
        
        <h3 className="text-xs font-medium text-white">
          {format(currentDate, 'MMM yyyy')}
        </h3>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={goToNextMonth}
          className="h-6 w-6 p-0 rounded-none"
        >
          <ChevronRight className="h-3 w-3" />
        </Button>
      </div>

      {/* Days of week header */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['Κ', 'Δ', 'Τ', 'Τ', 'Π', 'Π', 'Σ'].map((day) => (
          <div key={day} className="text-center text-xs text-gray-400 py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 flex-1">
        {days.map((day) => {
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isDayToday = isToday(day);
          const dayPrograms = getProgramsForDay(day);
          const dayString = format(day, 'yyyy-MM-dd');

          return (
            <div
              key={day.toISOString()}
              className={`
                min-h-[24px] p-1 text-xs cursor-pointer border border-gray-600 rounded-none
                ${isCurrentMonth ? 'bg-gray-800' : 'bg-gray-900'}
                ${isDayToday ? 'ring-1 ring-[#00ffba]' : ''}
                hover:bg-gray-700 transition-colors
              `}
              onClick={() => handleDayClick(day)}
            >
              <div className={`
                text-center mb-1
                ${isDayToday ? 'text-[#00ffba] font-bold' : isCurrentMonth ? 'text-white' : 'text-gray-500'}
              `}>
                {format(day, 'd')}
              </div>
              
              {/* Program indicators */}
              <div className="space-y-1">
                {dayPrograms.slice(0, 2).map((program) => {
                  const status = getWorkoutStatus(program, dayString);
                  return (
                    <div
                      key={program.id}
                      className={`
                        w-full h-1 rounded-none
                        ${status === 'completed' ? 'bg-[#00ffba]' : 
                          status === 'missed' ? 'bg-red-500' : 
                          'bg-yellow-500'}
                      `}
                    />
                  );
                })}
                {dayPrograms.length > 2 && (
                  <div className="text-xs text-center text-gray-400">
                    +{dayPrograms.length - 2}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
