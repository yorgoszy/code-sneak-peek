
import React, { useState, useEffect, useCallback } from 'react';
import { format } from "date-fns";
import { ActiveProgramsSidebar } from "@/components/active-programs/ActiveProgramsSidebar";
import { CalendarGrid } from "@/components/active-programs/calendar/CalendarGrid";
import { ActiveProgramsHeader } from "@/components/active-programs/ActiveProgramsHeader";
import { TodaysProgramsSection } from "@/components/active-programs/TodaysProgramsSection";
import { useMultiWorkoutManager } from "@/components/active-programs/calendar/MultiWorkoutManager";
import { DayProgramDialog } from "@/components/active-programs/calendar/DayProgramDialog";
import { useActivePrograms } from "@/hooks/useActivePrograms";
import { useWorkoutCompletions } from "@/hooks/useWorkoutCompletions";
import { supabase } from "@/integrations/supabase/client";
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

const ActivePrograms = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [workoutCompletions, setWorkoutCompletions] = useState<any[]>([]);
  const [realtimeKey, setRealtimeKey] = useState(0);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const { data: activePrograms = [], isLoading, error, refetch } = useActivePrograms();
  const { getWorkoutCompletions } = useWorkoutCompletions();
  
  // Multi-workout management
  const { 
    activeWorkouts, 
    openDialogs, 
    openWorkoutDialog, 
    closeWorkoutDialog 
  } = useMultiWorkoutManager();

  // Σημερινή ημερομηνία
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  // Φιλτράρουμε τα προγράμματα για σήμερα
  const programsForToday = activePrograms.filter(assignment => {
    if (!assignment.training_dates) return false;
    return assignment.training_dates.includes(todayStr);
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
    openWorkoutDialog(assignment, today);
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

  // ΚΡΙΤΙΚΟ: Enhanced refresh για ΑΜΕΣΗ ανανέωση
  const handleCalendarRefresh = useCallback(async () => {
    console.log('🔄 ActivePrograms: CRITICAL CALENDAR REFRESH');
    
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
          minimizedWorkout={null}
          onRestoreWorkout={() => {}}
          onCancelMinimizedWorkout={() => {}}
        />
        
        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="space-y-6">
            <ActiveProgramsHeader />

            {/* Calendar με ENHANCED realtime key */}
            <CalendarGrid
              currentMonth={currentMonth}
              setCurrentMonth={setCurrentMonth}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              activePrograms={activePrograms}
              workoutCompletions={workoutCompletions}
              realtimeKey={realtimeKey}
              onNameClick={handleProgramClick}
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

      {/* Multiple Day Program Dialogs */}
      {activeWorkouts.map(workout => (
        <DayProgramDialog
          key={workout.id}
          isOpen={openDialogs.has(workout.id)}
          onClose={() => closeWorkoutDialog(workout.id)}
          program={workout.assignment}
          selectedDate={workout.selectedDate}
          workoutStatus={getWorkoutStatus(workout.assignment)}
          onRefresh={handleCalendarRefresh}
        />
      ))}
    </>
  );
};

export default ActivePrograms;
