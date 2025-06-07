import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns";
import { DayProgramDialog } from './DayProgramDialog';
import { CalendarNavigation } from './CalendarNavigation';
import { CalendarWeekDays } from './CalendarWeekDays';
import { CalendarDay } from './CalendarDay';
import { WeeklyView } from './WeeklyView';
import { DailyView } from './DailyView';
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface CalendarGridProps {
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
  selectedDate: Date | undefined;
  setSelectedDate: (date: Date) => void;
  activePrograms: EnrichedAssignment[];
  workoutCompletions: any[];
  realtimeKey: number;
  onNameClick: (program: any, event: React.MouseEvent) => void;
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
  const [dayProgramDialogOpen, setDayProgramDialogOpen] = useState(false);
  const [selectedProgramForDay, setSelectedProgramForDay] = useState<EnrichedAssignment | null>(null);
  const [selectedDialogDate, setSelectedDialogDate] = useState<Date | null>(null);
  const [calendarView, setCalendarView] = useState<'monthly' | 'weekly' | 'daily'>('monthly');

  // Force re-render when workoutCompletions change
  useEffect(() => {
    console.log('🔄 Calendar workoutCompletions updated, triggering re-render');
  }, [workoutCompletions, realtimeKey]);

  // Create a list with all dates that have programs and their statuses
  const programDatesWithStatus = activePrograms.reduce((dates: any[], assignment) => {
    if (assignment.training_dates && assignment.app_users) {
      const assignmentCompletions = workoutCompletions.filter(c => c.assignment_id === assignment.id);
      
      assignment.training_dates.forEach(dateStr => {
        const completion = assignmentCompletions.find(c => c.scheduled_date === dateStr);
        dates.push({
          date: dateStr,
          status: completion?.status || 'scheduled',
          assignmentId: assignment.id,
          userName: assignment.app_users.name || 'Άγνωστος',
          assignment: assignment
        });
      });
    }
    return dates;
  }, []);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleUserNameClick = (programData: any, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedProgramForDay(programData.assignment);
    setSelectedDialogDate(new Date(programData.date));
    setDayProgramDialogOpen(true);
  };

  const MonthlyView = () => (
    <div className="w-full">
      <CalendarNavigation 
        currentMonth={currentMonth}
        setCurrentMonth={setCurrentMonth}
      />

      <CalendarWeekDays />

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 border border-gray-200">
        {days.map((date) => {
          const dateStr = format(date, 'yyyy-MM-dd');
          const dateProgramsWithStatus = programDatesWithStatus.filter(d => d.date === dateStr);

          return (
            <CalendarDay
              key={`${dateStr}-${realtimeKey}`}
              date={date}
              currentMonth={currentMonth}
              selectedDate={selectedDate}
              programsForDate={dateProgramsWithStatus}
              realtimeKey={realtimeKey}
              onDateClick={handleDateClick}
              onUserNameClick={handleUserNameClick}
            />
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      <Card className="rounded-none">
        <CardContent>
          <Tabs value={calendarView} onValueChange={(value) => setCalendarView(value as 'monthly' | 'weekly' | 'daily')} className="w-full">
            <TabsList className="grid w-full grid-cols-3 rounded-none">
              <TabsTrigger value="monthly" className="rounded-none">Μηνιαία</TabsTrigger>
              <TabsTrigger value="weekly" className="rounded-none">Εβδομαδιαία</TabsTrigger>
              <TabsTrigger value="daily" className="rounded-none">Ημερήσια</TabsTrigger>
            </TabsList>

            <TabsContent value="monthly" className="mt-4">
              <MonthlyView />
            </TabsContent>

            <TabsContent value="weekly" className="mt-4">
              <WeeklyView
                currentMonth={currentMonth}
                setCurrentMonth={setCurrentMonth}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                programDatesWithStatus={programDatesWithStatus}
                realtimeKey={realtimeKey}
                onUserNameClick={handleUserNameClick}
              />
            </TabsContent>

            <TabsContent value="daily" className="mt-4">
              <DailyView
                currentMonth={currentMonth}
                setCurrentMonth={setCurrentMonth}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                programDatesWithStatus={programDatesWithStatus}
                realtimeKey={realtimeKey}
                onUserNameClick={handleUserNameClick}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialog for specific workout */}
      <DayProgramDialog
        isOpen={dayProgramDialogOpen}
        onClose={() => {
          setDayProgramDialogOpen(false);
          setSelectedProgramForDay(null);
        }}
        program={selectedProgramForDay}
        selectedDate={selectedDialogDate}
        workoutStatus={selectedProgramForDay && selectedDialogDate ? 
          workoutCompletions.find(c => 
            c.assignment_id === selectedProgramForDay.id && 
            c.scheduled_date === format(selectedDialogDate, 'yyyy-MM-dd')
          )?.status || 'scheduled'
          : 'scheduled'
        }
        onRefresh={() => {
          // Refresh logic handled by parent component
        }}
      />
    </>
  );
};
