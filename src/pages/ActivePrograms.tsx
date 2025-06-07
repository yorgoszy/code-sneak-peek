
import React, { useState, useEffect } from 'react';
import { format } from "date-fns";
import { ActiveProgramsSidebar } from "@/components/active-programs/ActiveProgramsSidebar";
import { DayProgramDialog } from "@/components/active-programs/calendar/DayProgramDialog";
import { CalendarGrid } from "@/components/active-programs/calendar/CalendarGrid";
import { ActiveProgramsHeader } from "@/components/active-programs/ActiveProgramsHeader";
import { TodaysProgramsSection } from "@/components/active-programs/TodaysProgramsSection";
import { useActivePrograms } from "@/hooks/useActivePrograms";
import { useWorkoutCompletions } from "@/hooks/useWorkoutCompletions";
import { useRunningWorkouts } from "@/hooks/useRunningWorkouts";
import { supabase } from "@/integrations/supabase/client";

const ActivePrograms = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [workoutCompletions, setWorkoutCompletions] = useState<any[]>([]);
  const [dayDialogOpen, setDayDialogOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<any>(null);
  const [realtimeKey, setRealtimeKey] = useState(0);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const { data: activePrograms = [], isLoading, error, refetch } = useActivePrograms();
  const { getWorkoutCompletions } = useWorkoutCompletions();
  const { startWorkout } = useRunningWorkouts();

  // Σημερινή ημερομηνία
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  // Φιλτράρουμε τα προγράμματα για σήμερα
  const programsForToday = activePrograms.filter(assignment => {
    if (!assignment.training_dates) return false;
    return assignment.training_dates.includes(todayStr);
  });

  // Φόρτωση workout completions
  const loadCompletions = async () => {
    if (activePrograms.length === 0) return;
    
    try {
      const allCompletions = [];
      for (const assignment of activePrograms) {
        const completions = await getWorkoutCompletions(assignment.id);
        allCompletions.push(...completions);
      }
      console.log('📊 Loaded completions:', allCompletions.length);
      setWorkoutCompletions(allCompletions);
    } catch (error) {
      console.error('Error loading workout completions:', error);
    }
  };

  useEffect(() => {
    loadCompletions();
  }, [activePrograms, getWorkoutCompletions]);

  // Enhanced real-time subscription
  useEffect(() => {
    console.log('🔄 Setting up enhanced real-time subscription...');
    
    const channel = supabase
      .channel('workout-completions-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workout_completions'
        },
        async (payload) => {
          console.log('🔄 Real-time workout completion change detected:', payload);
          
          // Άμεση ενημέρωση του realtimeKey για αναγκαστικό re-render
          setRealtimeKey(prev => prev + 1);
          
          // Άμεση ανανέωση των completions
          await loadCompletions();
          
          // Ανανέωση των programs
          refetch();
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  // Force refresh every few seconds as fallback
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('⏰ Periodic refresh trigger');
      setRealtimeKey(prev => prev + 1);
      loadCompletions();
    }, 5000); // Every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const handleProgramClick = (assignment: any) => {
    setSelectedProgram(assignment);
    setDayDialogOpen(true);
  };

  const handleStartWorkout = () => {
    if (selectedProgram) {
      startWorkout(selectedProgram, today);
    }
  };

  const handleDeleteProgram = async (assignmentId: string) => {
    try {
      console.log('Διαγραφή προγράμματος:', assignmentId);
      refetch();
    } catch (error) {
      console.error('Σφάλμα κατά τη διαγραφή:', error);
    }
  };

  const getWorkoutStatus = (assignment: any) => {
    const completion = workoutCompletions.find(c => 
      c.assignment_id === assignment.id && c.scheduled_date === todayStr
    );
    return completion?.status || 'scheduled';
  };

  const handleNameClick = (program: any, event: React.MouseEvent) => {
    // This function is no longer needed as CalendarGrid handles its own DayProgramDialog
  };

  const handleCalendarRefresh = () => {
    console.log('🔄 Calendar refresh triggered');
    setRealtimeKey(prev => prev + 1);
    loadCompletions();
    refetch();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex w-full items-center justify-center">
        <div>Φόρτωση προγραμμάτων...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex w-full items-center justify-center">
        <div className="text-red-600">Σφάλμα κατά τη φόρτωση: {error.message}</div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 flex w-full">
        {/* Sidebar */}
        <ActiveProgramsSidebar 
          isCollapsed={isCollapsed} 
          setIsCollapsed={setIsCollapsed}
          stats={{
            totalPrograms: activePrograms.length,
            activeToday: programsForToday.length,
            completedToday: workoutCompletions.filter(c => 
              c.scheduled_date === todayStr && c.status === 'completed'
            ).length
          }}
          activePrograms={activePrograms}
          onRefresh={refetch}
          onDelete={handleDeleteProgram}
        />
        
        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="space-y-6">
            <ActiveProgramsHeader />

            {/* Calendar */}
            <CalendarGrid
              currentMonth={currentMonth}
              setCurrentMonth={setCurrentMonth}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              activePrograms={activePrograms}
              workoutCompletions={workoutCompletions}
              realtimeKey={realtimeKey}
              onNameClick={handleNameClick}
            />

            {/* Today's Programs */}
            <TodaysProgramsSection
              programsForToday={programsForToday}
              workoutCompletions={workoutCompletions}
              todayStr={todayStr}
              onProgramClick={handleProgramClick}
            />
          </div>
        </div>
      </div>

      {/* Day Program Dialog */}
      <DayProgramDialog
        isOpen={dayDialogOpen}
        onClose={() => setDayDialogOpen(false)}
        program={selectedProgram}
        selectedDate={today}
        workoutStatus={selectedProgram ? getWorkoutStatus(selectedProgram) : 'scheduled'}
        onRefresh={handleCalendarRefresh}
        onMinimize={handleStartWorkout}
      />
    </>
  );
};

export default ActivePrograms;
