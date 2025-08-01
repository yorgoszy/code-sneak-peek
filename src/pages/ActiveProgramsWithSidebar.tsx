import React, { useState, useEffect, useCallback } from 'react';
import { format } from "date-fns";
import { SidebarProvider, Sidebar, SidebarContent, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { CalendarGrid } from "@/components/active-programs/calendar/CalendarGrid";
import { ActiveProgramsHeader } from "@/components/active-programs/ActiveProgramsHeader";
import { TodaysProgramsSection } from "@/components/active-programs/TodaysProgramsSection";
import { useMultipleWorkouts } from "@/hooks/useMultipleWorkouts";
import { DayProgramDialog } from "@/components/active-programs/calendar/DayProgramDialog";
import { useActivePrograms } from "@/hooks/useActivePrograms";
import { useWorkoutCompletions } from "@/hooks/useWorkoutCompletions";
import { useWorkoutCompletionsCache } from "@/hooks/useWorkoutCompletionsCache";
import { workoutStatusService } from "@/hooks/useWorkoutCompletions/workoutStatusService";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

const ActiveProgramsWithSidebar = () => {
  const [workoutCompletions, setWorkoutCompletions] = useState<any[]>([]);
  const [realtimeKey, setRealtimeKey] = useState(0);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [openDialogs, setOpenDialogs] = useState<Set<string>>(new Set());
  const isMobile = useIsMobile();

  const { data: activePrograms = [], isLoading, error, refetch } = useActivePrograms();
  const { getWorkoutCompletions } = useWorkoutCompletions();
  const completionsCache = useWorkoutCompletionsCache();
  
  // Multi-workout management
  const { 
    activeWorkouts, 
    startWorkout,
    updateElapsedTime,
    completeWorkout,
    cancelWorkout,
    getWorkout,
    formatTime
  } = useMultipleWorkouts();

  // Check for missed workouts on component mount
  useEffect(() => {
    const checkMissedWorkouts = async () => {
      try {
        console.log('🔄 Checking for missed workouts on page load...');
        await workoutStatusService.markMissedWorkoutsForPastDates();
        console.log('✅ Missed workouts check completed');
      } catch (error) {
        console.error('❌ Error checking missed workouts:', error);
      }
    };

    checkMissedWorkouts();
  }, []);

  // Timer για ενημέρωση του elapsed time για όλες τις ενεργές προπονήσεις
  useEffect(() => {
    const interval = setInterval(() => {
      activeWorkouts.forEach(workout => {
        if (workout.workoutInProgress) {
          const newElapsedTime = Math.floor((new Date().getTime() - workout.startTime.getTime()) / 1000);
          updateElapsedTime(workout.id, newElapsedTime);
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeWorkouts, updateElapsedTime]);

  // Σημερινή ημερομηνία
  const dayToShow = selectedDate || new Date();
  const dayToShowStr = format(dayToShow, 'yyyy-MM-dd');

  // Φιλτράρουμε τα προγράμματα για την ημερομηνία που έχει επιλεγεί
  const programsForSelectedDate = activePrograms.filter(assignment => {
    if (!assignment.training_dates) return false;
    return assignment.training_dates.includes(dayToShowStr);
  });

  // Φόρτωση workout completions
  const loadCompletions = useCallback(async () => {
    if (activePrograms.length === 0) return;
    
    try {
      console.log('📊 ActivePrograms: Loading completions for', activePrograms.length, 'assignments');
      const allCompletions = [];
      for (const assignment of activePrograms) {
        const completions = await getWorkoutCompletions(assignment.id);
        allCompletions.push(...completions);
      }
      console.log('📊 ActivePrograms: Loaded completions:', allCompletions.length);
      setWorkoutCompletions(allCompletions);
    } catch (error) {
      console.error('❌ ActivePrograms: Error loading workout completions:', error);
    }
  }, [activePrograms, getWorkoutCompletions]);

  // Initial load
  useEffect(() => {
    loadCompletions();
  }, [loadCompletions]);

  // Enhanced real-time subscription
  useEffect(() => {
    console.log('🔄 ActivePrograms: Setting up REAL-TIME subscriptions...');
    
    const completionsChannel = supabase
      .channel(`workout-completions-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workout_completions'
        },
        async (payload) => {
          console.log('🔄 REALTIME: workout completion change:', payload);
          
          // ΑΜΕΣΗ ανανέωση του realtime key
          setRealtimeKey(Date.now());
          
          // Clear cache for affected assignment
          if (payload.new && typeof payload.new === 'object' && 'assignment_id' in payload.new) {
            completionsCache.invalidateAssignmentCache(payload.new.assignment_id as string);
          }
          
          // Έλεγχος για αυτόματη ολοκλήρωση προγραμμάτων
          try {
            const { programCompletionService } = await import('@/hooks/useWorkoutCompletions/programCompletionService');
            await programCompletionService.checkAndCompleteProgramAssignments();
          } catch (error) {
            console.error('Error checking program completions:', error);
          }
          
          // Reload completions
          await loadCompletions();
          
          // Refetch active programs
          refetch();
        }
      )
      .subscribe((status) => {
        console.log('📡 Completions subscription status:', status);
      });

    const assignmentsChannel = supabase
      .channel(`assignments-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'program_assignments'
        },
        async (payload) => {
          console.log('🔄 REALTIME: assignment change:', payload);
          
          // ΑΜΕΣΗ ανανέωση του realtime key
          setRealtimeKey(Date.now());
          
          // Clear completions cache
          completionsCache.clearCache();
          
          // Refetch active programs
          refetch();
          await loadCompletions();
        }
      )
      .subscribe((status) => {
        console.log('📡 Assignments subscription status:', status);
      });

    return () => {
      console.log('🔌 ActivePrograms: Cleaning up real-time subscriptions');
      supabase.removeChannel(completionsChannel);
      supabase.removeChannel(assignmentsChannel);
    };
  }, [loadCompletions, refetch]);

  // Χειρισμός κλικ σε πρόγραμμα - ανοίγει νέο dialog
  const handleProgramClick = (assignment: EnrichedAssignment) => {
    const workoutId = `${assignment.id}-${dayToShow.toISOString().split('T')[0]}`;
    
    // Έναρξη προπόνησης
    startWorkout(assignment, dayToShow);
    
    // Άνοιγμα dialog
    setOpenDialogs(prev => new Set(prev).add(workoutId));
  };

  const handleDialogClose = (workoutId: string) => {
    setOpenDialogs(prev => {
      const newSet = new Set(prev);
      newSet.delete(workoutId);
      return newSet;
    });
  };

  const handleDeleteProgram = async (assignmentId: string) => {
    try {
      console.log('Διαγραφή προγράμματος:', assignmentId);
      refetch();
    } catch (error) {
      console.error('Σφάλμα κατά τη διαγραφή:', error);
    }
  };

  // Update το getWorkoutStatus να παίρνει ως input ημερομηνία
  const getWorkoutStatus = (assignment: any, dateStr: string) => {
    const completion = workoutCompletions.find(c => 
      c.assignment_id === assignment.id && c.scheduled_date === dateStr
    );
    return completion?.status || 'scheduled';
  };

  // ΚΡΙΤΙΚΟ: Enhanced refresh για ΑΜΕΣΗ ανανέωση
  const handleCalendarRefresh = useCallback(async () => {
    console.log('🔄 ActivePrograms: CRITICAL CALENDAR REFRESH');
    
    // Έλεγχος για χαμένες προπονήσεις πριν το refresh
    try {
      await workoutStatusService.markMissedWorkoutsForPastDates();
    } catch (error) {
      console.error('❌ Error checking missed workouts during refresh:', error);
    }
    
    // ΑΜΕΣΗ ανανέωση με unique timestamp
    const newKey = Date.now() + Math.random();
    setRealtimeKey(newKey);
    
    // Reload δεδομένων
    await loadCompletions();
    refetch();
    
    console.log('🔄 Calendar refresh completed with key:', newKey);
  }, [loadCompletions, refetch]);

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
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        
        <SidebarInset className="flex-1">
          {/* Header με sidebar trigger για mobile */}
          <header className="flex h-12 items-center border-b px-3 md:px-6 lg:hidden">
            <SidebarTrigger className="mr-3" />
            <span className="text-sm font-medium">Ενεργά Προγράμματα</span>
          </header>

          <div className="flex-1 p-3 md:p-6 w-full max-w-6xl mx-auto space-y-4 md:space-y-6">
            <ActiveProgramsHeader />

            {/* Calendar with ENHANCED realtime key */}
            <CalendarGrid
              currentMonth={currentMonth}
              setCurrentMonth={setCurrentMonth}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              activePrograms={activePrograms}
              workoutCompletions={workoutCompletions}
              realtimeKey={realtimeKey}
              onNameClick={handleProgramClick}
              onRefresh={handleCalendarRefresh}
            />

            {/* Today's Programs for the selected date */}
            <TodaysProgramsSection
              programsForToday={programsForSelectedDate}
              workoutCompletions={workoutCompletions}
              todayStr={dayToShowStr}
              onProgramClick={handleProgramClick}
            />
          </div>
        </SidebarInset>
      </div>

      {/* Multiple Day Program Dialogs */}
      {activeWorkouts.map(workout => (
        <DayProgramDialog
          key={workout.id}
          isOpen={openDialogs.has(workout.id)}
          onClose={() => handleDialogClose(workout.id)}
          program={workout.assignment}
          selectedDate={workout.selectedDate}
          workoutStatus={getWorkoutStatus(workout.assignment, format(workout.selectedDate, 'yyyy-MM-dd'))}
          onRefresh={handleCalendarRefresh}
        />
      ))}
    </SidebarProvider>
  );
};

export default ActiveProgramsWithSidebar;