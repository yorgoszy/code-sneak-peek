
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, parseISO, getDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface ProgramCalendarProps {
  programs: EnrichedAssignment[];
}

// Mapping for training days to JavaScript day numbers
const TRAINING_DAY_MAP: Record<string, number> = {
  'sunday': 0,
  'monday': 1,
  'tuesday': 2,
  'wednesday': 3,
  'thursday': 4,
  'friday': 5,
  'saturday': 6
};

export const ProgramCalendar: React.FC<ProgramCalendarProps> = ({ programs }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  console.log('📅 ProgramCalendar rendering with programs:', programs.length);
  programs.forEach(program => {
    console.log('📊 Program in calendar:', {
      id: program.id,
      name: program.programs?.name,
      start_date: program.start_date,
      end_date: program.end_date,
      status: program.status,
      training_days: program.programs?.training_days
    });
  });

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
    const dayOfWeek = getDay(day); // 0 = Sunday, 1 = Monday, etc.
    
    console.log('🔍 Checking programs for day:', dayString, 'Day of week:', dayOfWeek);
    
    const dayPrograms = programs.filter(program => {
      if (!program.start_date || !program.end_date) {
        console.log('⚠️ Program missing dates:', program.id);
        return false;
      }
      
      try {
        const startDate = parseISO(program.start_date);
        const endDate = parseISO(program.end_date);
        const isInDateRange = day >= startDate && day <= endDate;
        
        if (!isInDateRange) {
          return false;
        }

        // Check if we have training days defined for the program
        const trainingDays = program.programs?.training_days;
        if (!trainingDays || !Array.isArray(trainingDays) || trainingDays.length === 0) {
          console.log('⚠️ No training days data for program:', program.id);
          return isInDateRange; // Fall back to showing every day in range
        }

        // Convert training day strings to day numbers and check if current day matches
        const trainingDayNumbers = trainingDays
          .map(day => TRAINING_DAY_MAP[day.toLowerCase()])
          .filter(dayNum => dayNum !== undefined);

        const isTrainingDay = trainingDayNumbers.includes(dayOfWeek);
        
        console.log('📊 Training day check for program:', program.id, {
          dayString,
          dayOfWeek,
          trainingDays,
          trainingDayNumbers,
          isTrainingDay,
          isInDateRange
        });
        
        return isInDateRange && isTrainingDay;
      } catch (error) {
        console.error('❌ Error parsing dates for program:', program.id, error);
        return false;
      }
    });
    
    console.log(`📅 Programs for ${dayString}:`, dayPrograms.length);
    return dayPrograms;
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-xl font-bold">
          {format(currentDate, 'MMMM yyyy')}
        </CardTitle>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPreviousMonth}
            className="rounded-none"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextMonth}
            className="rounded-none"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 mb-4">
          {['Κυρ', 'Δευ', 'Τρι', 'Τετ', 'Πεμ', 'Παρ', 'Σαβ'].map((day) => (
            <div key={day} className="p-2 text-center font-medium text-gray-600 text-sm">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const dayPrograms = getProgramsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isDayToday = isToday(day);
            
            return (
              <div
                key={day.toISOString()}
                className={`
                  min-h-[80px] p-1 border border-gray-200 rounded
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
                  {dayPrograms.map((program) => (
                    <div
                      key={program.id}
                      className="text-xs p-1 bg-blue-100 text-blue-800 rounded truncate"
                      title={program.programs?.name || 'Άγνωστο πρόγραμμα'}
                    >
                      {program.programs?.name || 'Άγνωστο πρόγραμμα'}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        
        {programs.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Δεν υπάρχουν ενεργά προγράμματα
          </div>
        )}
      </CardContent>
    </Card>
  );
};
