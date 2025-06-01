
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface ProgramCalendarProps {
  programs: EnrichedAssignment[];
}

export const ProgramCalendar: React.FC<ProgramCalendarProps> = ({ programs }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  console.log('📅 ProgramCalendar rendering with programs:', programs.length);
  programs.forEach(program => {
    console.log('📊 Program in calendar:', {
      id: program.id,
      name: program.programs?.name,
      user_name: program.app_users?.name,
      training_dates: program.training_dates,
      status: program.status
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
    
    console.log('🔍 Checking programs for day:', dayString);
    
    const dayPrograms = programs.filter(program => {
      // Check if this specific date is in the training_dates array
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

  return (
    <Card className="w-full rounded-none">
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
                  {dayPrograms.map((program) => (
                    <div
                      key={program.id}
                      className="text-xs p-1 bg-blue-100 text-blue-800 rounded-none truncate"
                      title={`${program.programs?.name || 'Άγνωστο πρόγραμμα'} - ${program.app_users?.name || 'Άγνωστος χρήστης'}`}
                    >
                      <div className="font-medium">{program.programs?.name || 'Άγνωστο πρόγραμμα'}</div>
                      <div className="text-gray-600">{program.app_users?.name || 'Άγνωστος χρήστης'}</div>
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
