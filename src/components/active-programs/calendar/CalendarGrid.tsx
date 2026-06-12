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
import { MonthlyView } from './MonthlyView';
import { MobileMonthlyView } from './MobileMonthlyView';

interface CalendarGridProps {
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
  selectedDate: Date | undefined;
  setSelectedDate: (date: Date) => void;
  activePrograms: EnrichedAssignment[];
  workoutCompletions: any[];
  realtimeKey: number;
  onNameClick: (assignment: EnrichedAssignment, date: Date) => void;
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
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    
    const dates = activePrograms.reduce((acc: any[], assignment) => {
      if (assignment.training_dates && assignment.app_users) {
        const assignmentCompletions = workoutCompletions.filter(c => c.assignment_id === assignment.id);
        
        assignment.training_dates.forEach(dateStr => {
          // Για completed προγράμματα, μην εμφανίζεις μελλοντικές ημέρες
          if (assignment.status === 'completed' && dateStr > todayStr) {
            return; // Skip future dates for completed programs
          }
          
          const completion = assignmentCompletions.find(c => c.scheduled_date === dateStr);
          acc.push({
            date: dateStr,
            status: completion?.status || 'scheduled',
            assignmentId: assignment.id,
            userName: assignment.app_users.name || 'Άγνωστος',
            assignment: assignment,
            rpeScore: completion?.rpe_score
          });
        });
      }
      return acc;
    }, []);
    
    console.log('📅 CalendarGrid: RECALCULATED program dates with status:', dates.length, 'Key:', realtimeKey + internalRealtimeKey);
    return dates;
  }, [activePrograms, workoutCompletions, realtimeKey, internalRealtimeKey]);

  // Device detection for mobile
  const [isMobile, setIsMobile] = React.useState<boolean>(false);
  React.useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 768);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  const weekDays = ['Δε', 'Τρ', 'Τε', 'Πε', 'Πα', 'Σα', 'Κυ'];

  // Calculate days etc:
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
    console.log('👤 CalendarGrid: User name clicked -> delegating to parent:', programData);
    const date = new Date(programData.date);
    // Delegate to parent so it can manage workouts/bubbles consistently
    onNameClick(programData.assignment, date);
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

  // Enhanced realtime key που συνδυάζει όλα τα keys
  const totalRealtimeKey = realtimeKey + internalRealtimeKey;

  return (
    <>
      <Card className="rounded-none h-full flex flex-col border-0 shadow-none">
        <CardContent className="p-1 sm:p-2 md:p-3 flex-1 flex flex-col min-h-0">
          <Tabs value={calendarView} onValueChange={(value) => setCalendarView(value as 'monthly' | 'weekly' | 'daily')} className="w-full flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-3 rounded-none text-xs sm:text-sm md:text-base h-8 sm:h-9 flex-shrink-0">
              <TabsTrigger value="monthly" className="rounded-none text-xs sm:text-sm">Μηνιαία</TabsTrigger>
              <TabsTrigger value="weekly" className="rounded-none text-xs sm:text-sm">Εβδομαδιαία</TabsTrigger>
              <TabsTrigger value="daily" className="rounded-none text-xs sm:text-sm">Ημερήσια</TabsTrigger>
            </TabsList>
            <TabsContent value="monthly" className="mt-1 flex-1 min-h-0 overflow-auto">
              <MonthlyView
                isMobile={isMobile}
                weekDays={weekDays}
                days={days}
                programDatesWithStatus={programDatesWithStatus}
                currentMonth={currentMonth}
                selectedDate={selectedDate}
                realtimeKey={realtimeKey}
                internalRealtimeKey={internalRealtimeKey}
                setCurrentMonth={setCurrentMonth}
                onDateClick={handleDateClick}
                onUserNameClick={handleUserNameClick}
                onDayNumberClick={handleDayNumberClick}
              />
            </TabsContent>
            <TabsContent value="weekly" className="mt-1 flex-1 min-h-0 overflow-auto">
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
            <TabsContent value="daily" className="mt-1 flex-1 min-h-0 overflow-auto">
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

    </>
  );
};
