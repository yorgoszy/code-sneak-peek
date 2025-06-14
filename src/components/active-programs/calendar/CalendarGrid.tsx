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
import { supabase } from "@/integrations/supabase/client";
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
  onRefresh?: () => void;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  currentMonth,
  setCurrentMonth,
  selectedDate,
  setSelectedDate,
  activePrograms,
  workoutCompletions,
  realtimeKey,
  onNameClick,
  onRefresh
}) => {
  const [dayProgramDialogOpen, setDayProgramDialogOpen] = useState(false);
  const [selectedProgramForDay, setSelectedProgramForDay] = useState<EnrichedAssignment | null>(null);
  const [selectedDialogDate, setSelectedDialogDate] = useState<Date | null>(null);
  const [calendarView, setCalendarView] = useState<'monthly' | 'weekly' | 'daily'>('monthly');
  const [internalRealtimeKey, setInternalRealtimeKey] = useState(0);

  // Enhanced real-time subscription με άμεση ανανέωση
  useEffect(() => {
    console.log('🔄 CalendarGrid: Setting up ENHANCED real-time subscription...');
    
    const channelName = `calendar-updates-${Date.now()}-${Math.random()}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workout_completions'
        },
        (payload) => {
          console.log('🔄 CalendarGrid: IMMEDIATE workout completion change:', payload);
          setInternalRealtimeKey(prev => {
            const newKey = Date.now(); // Unique timestamp
            console.log('🔄 CalendarGrid: FORCE updating internal key to:', newKey);
            return newKey;
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'program_assignments'
        },
        (payload) => {
          console.log('🔄 CalendarGrid: IMMEDIATE assignment change:', payload);
          setInternalRealtimeKey(prev => {
            const newKey = Date.now(); // Unique timestamp
            console.log('🔄 CalendarGrid: FORCE updating internal key to:', newKey);
            return newKey;
          });
        }
      )
      .subscribe((status) => {
        console.log('📡 CalendarGrid ENHANCED subscription status:', status);
      });

    return () => {
      console.log('🔌 CalendarGrid: Cleaning up ENHANCED real-time subscription');
      supabase.removeChannel(channel);
    };
  }, []);

  // Force re-render όταν αλλάζουν τα δεδομένα
  useEffect(() => {
    console.log('🔄 CalendarGrid: FORCE RE-RENDER triggered', {
      workoutCompletionsLength: workoutCompletions.length,
      realtimeKey,
      internalRealtimeKey
    });
  }, [workoutCompletions, realtimeKey, internalRealtimeKey]);

  // Create a list with all dates that have programs and their statuses - με enhanced key
  const programDatesWithStatus = React.useMemo(() => {
    const dates = activePrograms.reduce((acc: any[], assignment) => {
      if (assignment.training_dates && assignment.app_users) {
        const assignmentCompletions = workoutCompletions.filter(c => c.assignment_id === assignment.id);
        
        assignment.training_dates.forEach(dateStr => {
          const completion = assignmentCompletions.find(c => c.scheduled_date === dateStr);
          acc.push({
            date: dateStr,
            status: completion?.status || 'scheduled',
            assignmentId: assignment.id,
            userName: assignment.app_users.name || 'Άγνωστος',
            assignment: assignment
          });
        });
      }
      return acc;
    }, []);
    
    console.log('📅 CalendarGrid: RECALCULATED program dates with status:', dates.length, 'Key:', realtimeKey + internalRealtimeKey);
    return dates;
  }, [activePrograms, workoutCompletions, realtimeKey, internalRealtimeKey]);

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
    console.log('👤 CalendarGrid: User name clicked:', programData);
    setSelectedProgramForDay(programData.assignment);
    setSelectedDialogDate(new Date(programData.date));
    setDayProgramDialogOpen(true);
  };

  // ✨ Όταν γίνεται κλικ στον αριθμό ημέρας, αλλάζει σε ημερήσια καρτέλα και επιλέγεται η ημερομηνία!
  const handleDayNumberClick = (date: Date) => {
    setSelectedDate(date);
    setCurrentMonth(date);
    setCalendarView('daily');
  };

  // ΝΕΟ: handleDialogClose κάνει force refresh μέσω parent 
  const handleDialogClose = () => {
    console.log('🔒 CalendarGrid: Dialog closing, FORCING refresh');
    setDayProgramDialogOpen(false);
    setSelectedProgramForDay(null);
    setInternalRealtimeKey(Date.now());
    // Κάλεσε το onRefresh αν υπάρχει, για να ανανεώσει τα completions από τη βάση
    if (typeof onRefresh === "function") {
      onRefresh();
    }
  };

  const MonthlyView = () => (
    <div className="w-full">
      {/* Navigation και grid εβδομάδων */}
      <CalendarNavigation 
        currentMonth={currentMonth}
        setCurrentMonth={setCurrentMonth}
      />
      <CalendarWeekDays />
      {/* Responsive grid - οριζόντια scroll σε κινητά */}
      <div className="grid grid-cols-7 border border-gray-200 gap-px overflow-x-auto md:overflow-x-visible"
        style={{ minWidth: 410 }}
      >
        {days.map((date) => {
          const dateStr = format(date, 'yyyy-MM-dd');
          const dateProgramsWithStatus = programDatesWithStatus.filter(d => d.date === dateStr);
          
          // Unique key που συνδυάζει όλα τα realtime keys
          const enhancedKey = `${dateStr}-${realtimeKey}-${internalRealtimeKey}-${Date.now()}`;
          
          return (
            <CalendarDay
              key={enhancedKey}
              date={date}
              currentMonth={currentMonth}
              selectedDate={selectedDate}
              programsForDate={dateProgramsWithStatus}
              realtimeKey={realtimeKey + internalRealtimeKey}
              onDateClick={handleDateClick}
              onUserNameClick={handleUserNameClick}
              onDayNumberClick={handleDayNumberClick}
            />
          );
        })}
      </div>
    </div>
  );

  // Enhanced realtime key που συνδυάζει όλα τα keys
  const totalRealtimeKey = realtimeKey + internalRealtimeKey;

  return (
    <>
      <Card className="rounded-none">
        <CardContent>
          <Tabs value={calendarView} onValueChange={(value) => setCalendarView(value as 'monthly' | 'weekly' | 'daily')} className="w-full">
            <TabsList className="grid w-full grid-cols-3 rounded-none text-xs md:text-base">
              <TabsTrigger value="monthly" className="rounded-none">Μηνιαία</TabsTrigger>
              <TabsTrigger value="weekly" className="rounded-none">Εβδομαδιαία</TabsTrigger>
              <TabsTrigger value="daily" className="rounded-none">Ημερήσια</TabsTrigger>
            </TabsList>
            <TabsContent value="monthly" className="mt-2 sm:mt-4">
              <MonthlyView />
            </TabsContent>
            <TabsContent value="weekly" className="mt-2 sm:mt-4">
              <WeeklyView
                currentMonth={currentMonth}
                setCurrentMonth={setCurrentMonth}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                programDatesWithStatus={programDatesWithStatus}
                realtimeKey={totalRealtimeKey}
                onUserNameClick={handleUserNameClick}
              />
            </TabsContent>
            <TabsContent value="daily" className="mt-2 sm:mt-4">
              <DailyView
                currentMonth={currentMonth}
                setCurrentMonth={setCurrentMonth}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                programDatesWithStatus={programDatesWithStatus}
                realtimeKey={totalRealtimeKey}
                onUserNameClick={handleUserNameClick}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialog για συγκεκριμένη προπόνηση με enhanced refresh */}
      <DayProgramDialog
        isOpen={dayProgramDialogOpen}
        onClose={handleDialogClose}
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
          console.log('🔄 CalendarGrid: MANUAL FORCE refresh triggered');
          setInternalRealtimeKey(Date.now());
        }}
      />
    </>
  );
};
