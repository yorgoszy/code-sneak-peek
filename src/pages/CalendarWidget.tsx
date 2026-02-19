import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
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
import { CustomLoadingScreen } from "@/components/ui/custom-loading";
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

const CalendarWidget = () => {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  
  const [workoutCompletions, setWorkoutCompletions] = useState<any[]>([]);
  const [realtimeKey, setRealtimeKey] = useState(0);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [openDialogs, setOpenDialogs] = useState<Set<string>>(new Set());

  const { data: activePrograms = [], isLoading, error, refetch } = useActivePrograms();
  const { getWorkoutCompletions } = useWorkoutCompletions();
  const completionsCache = useWorkoutCompletionsCache();
  
  // Multi-workout management
  const { 
    activeWorkouts, 
    openWorkout,
    updateElapsedTime,
    removeWorkout,
  } = useMultipleWorkouts();

  useEffect(() => {
    // Set custom manifest for calendar widget
    const manifestData = {
      name: 'Ημερολόγιο - HYPERKIDS',
      short_name: 'Ημερολόγιο',
      description: 'Ημερολόγιο Προπονήσεων HYPERKIDS',
      theme_color: '#00ffba',
      background_color: '#ffffff',
      display: 'standalone',
      orientation: 'portrait',
      start_url: '/calendar-widget',
      scope: '/calendar-widget',
      icons: [
        {
          src: '/pwa-icons/calendar-icon.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable'
        }
      ]
    };

    const manifestBlob = new Blob([JSON.stringify(manifestData)], { type: 'application/json' });
    const manifestURL = URL.createObjectURL(manifestBlob);
    
    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = manifestURL;
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
      URL.revokeObjectURL(manifestURL);
    };
  }, []);

  useEffect(() => {
    const userAgent = navigator.userAgent;
    const checkMissedWorkouts = async () => {
      try {
        await workoutStatusService.markMissedWorkoutsForPastDates();
      } catch (error) {
        console.error('❌ Error checking missed workouts:', error);
      }
    };
    checkMissedWorkouts();
  }, []);

  // Timer για ενημέρωση του elapsed time
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

  const dayToShow = selectedDate || new Date();
  const dayToShowStr = format(dayToShow, 'yyyy-MM-dd');

  const programsForSelectedDate = activePrograms.filter(assignment => {
    if (!assignment.training_dates) return false;
    return assignment.training_dates.includes(dayToShowStr);
  });

  // Φόρτωση workout completions
  const loadCompletions = useCallback(async () => {
    if (activePrograms.length === 0) return;
    
    try {
      const allCompletions = [];
      for (const assignment of activePrograms) {
        const completions = await getWorkoutCompletions(assignment.id);
        allCompletions.push(...completions);
      }
      setWorkoutCompletions(allCompletions);
    } catch (error) {
      console.error('❌ Error loading workout completions:', error);
    }
  }, [activePrograms, getWorkoutCompletions]);

  useEffect(() => {
    loadCompletions();
  }, [loadCompletions]);

  // Real-time subscriptions
  useEffect(() => {
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
          setRealtimeKey(Date.now());
          
          if (payload.new && typeof payload.new === 'object' && 'assignment_id' in payload.new) {
            completionsCache.invalidateAssignmentCache(payload.new.assignment_id as string);
          }
          
          try {
            const { programCompletionService } = await import('@/hooks/useWorkoutCompletions/programCompletionService');
            await programCompletionService.checkAndCompleteProgramAssignments();
          } catch (error) {
            console.error('Error checking program completions:', error);
          }
          
          await loadCompletions();
          refetch();
        }
      )
      .subscribe();

    const assignmentsChannel = supabase
      .channel(`assignments-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'program_assignments'
        },
        async () => {
          setRealtimeKey(Date.now());
          completionsCache.clearCache();
          refetch();
          await loadCompletions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(completionsChannel);
      supabase.removeChannel(assignmentsChannel);
    };
  }, [loadCompletions, refetch, completionsCache]);

  const handleProgramClick = (assignment: EnrichedAssignment) => {
    const workoutId = `${assignment.id}-${dayToShow.toISOString().split('T')[0]}`;
    openWorkout(assignment, dayToShow);
    setOpenDialogs(prev => new Set(prev).add(workoutId));
  };

  const handleDialogClose = (workoutId: string) => {
    removeWorkout(workoutId);
    setOpenDialogs(prev => {
      const newSet = new Set(prev);
      newSet.delete(workoutId);
      return newSet;
    });
  };

  const getWorkoutStatus = (assignment: any, dateStr: string) => {
    const completion = workoutCompletions.find(c => 
      c.assignment_id === assignment.id && c.scheduled_date === dateStr
    );
    return completion?.status || 'scheduled';
  };

  const handleCalendarRefresh = useCallback(async () => {
    try {
      await workoutStatusService.markMissedWorkoutsForPastDates();
    } catch (error) {
      console.error('❌ Error checking missed workouts during refresh:', error);
    }
    
    const newKey = Date.now() + Math.random();
    setRealtimeKey(newKey);
    await loadCompletions();
    refetch();
  }, [loadCompletions, refetch]);

  if (authLoading || isLoading) {
    return <CustomLoadingScreen />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/auth" replace />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-red-600">Σφάλμα κατά τη φόρτωση: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex-1 flex flex-col space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="p-3 sm:p-4 md:p-6 pb-0">
          <ActiveProgramsHeader />
        </div>

        {/* Calendar */}
        <div className="w-full">
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
        </div>

        {/* Today's Programs */}
        <div className="p-3 sm:p-4 md:p-6 pt-0">
          <TodaysProgramsSection
            programsForToday={programsForSelectedDate}
            workoutCompletions={workoutCompletions}
            todayStr={dayToShowStr}
            onProgramClick={handleProgramClick}
          />
        </div>
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
    </div>
  );
};

export default CalendarWidget;
