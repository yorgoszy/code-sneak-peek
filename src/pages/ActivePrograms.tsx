
import React, { useState, useEffect, useCallback } from 'react';
import { format } from "date-fns";
import { Navigate, useNavigate } from "react-router-dom";
import { CalendarGrid } from "@/components/active-programs/calendar/CalendarGrid";
import { ActiveProgramsHeader } from "@/components/active-programs/ActiveProgramsHeader";
import { TodaysBubbles } from "@/components/active-programs/TodaysBubbles";
import { useMultipleWorkouts } from "@/hooks/useMultipleWorkouts";
import { DayProgramDialog } from "@/components/active-programs/calendar/DayProgramDialog";
import { useActivePrograms } from "@/hooks/useActivePrograms";

import { useWorkoutCompletionsCache } from "@/hooks/useWorkoutCompletionsCache";
import { workoutStatusService } from "@/hooks/useWorkoutCompletions/workoutStatusService";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimePrograms } from "@/hooks/useRealtimePrograms";
import { useLiveWorkoutData } from "@/hooks/useLiveWorkoutData";
import { useAuth } from "@/hooks/useAuth";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { CustomLoadingScreen } from "@/components/ui/custom-loading";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { LogOut, Menu } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

const ActivePrograms = () => {
  const { user, loading: authLoading, signOut, isAuthenticated } = useAuth();
  const { isAdmin, userProfile, loading: rolesLoading } = useRoleCheck();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [hasCheckedRedirect, setHasCheckedRedirect] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const [workoutCompletions, setWorkoutCompletions] = useState<any[]>([]);
  const [realtimeKey, setRealtimeKey] = useState(0);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeAssignmentId, setActiveAssignmentId] = useState<string | null>(null);

  // Authentication and redirect logic
  useEffect(() => {
    if (!authLoading && !rolesLoading) {
      if (!isAuthenticated) {
        setHasCheckedRedirect(true);
        return;
      }
      
      if (userProfile && !isAdmin) {
        navigate(`/user/${userProfile.user_id}`);
        return;
      }
      
      setHasCheckedRedirect(true);
    }
  }, [authLoading, rolesLoading, isAuthenticated, userProfile, isAdmin, navigate]);

  const { data: allPrograms = [], isLoading, error, refetch } = useActivePrograms();
  
  // Admin βλέπει μόνο assignments χρηστών που δημιουργήθηκαν από admin (coach_id = admin ID)
  const ADMIN_ID = 'c6d44641-3b95-46bd-8270-e5ed72de25ad';
  const activePrograms = allPrograms.filter(p => p.app_users?.coach_id === ADMIN_ID);
  // completionsCache kept for other uses
  const completionsCache = useWorkoutCompletionsCache();
  
  // Multi-workout management
  const { 
    activeWorkouts, 
    openWorkout,
    updateElapsedTime,
    completeWorkout,
    cancelWorkout,
    removeWorkout,
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
  // Για completed προγράμματα, μην εμφανίζεις μελλοντικές ημέρες
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const programsForSelectedDate = activePrograms.filter(assignment => {
    if (!assignment.training_dates) return false;
    const hasDateScheduled = assignment.training_dates.includes(dayToShowStr);
    
    // Αν το πρόγραμμα είναι completed και η επιλεγμένη ημέρα είναι στο μέλλον, μην το εμφανίσεις
    if (assignment.status === 'completed' && dayToShowStr > todayStr) {
      return false;
    }
    
    return hasDateScheduled;
  });

  // Σημερινά προγράμματα - πάντα βάσει σημερινής ημερομηνίας για τα bubbles
  const programsForToday = activePrograms.filter(assignment => {
    if (!assignment.training_dates) return false;
    return assignment.training_dates.includes(todayStr);
  });

  // Live workout data from DB for cross-device visibility
  const todayAssignmentIds = React.useMemo(() => programsForToday.map(a => a.id), [programsForToday]);
  const { liveWorkouts } = useLiveWorkoutData(todayAssignmentIds);

  // Φόρτωση workout completions - χρησιμοποιούμε ref για σταθερή αναφορά
  const activeProgramsRef = React.useRef(activePrograms);
  activeProgramsRef.current = activePrograms;

  const loadCompletions = useCallback(async () => {
    const programs = activeProgramsRef.current;
    if (programs.length === 0) return;
    
    try {
      const assignmentIds = programs.map(p => p.id);
      console.log('📊 ActivePrograms: Bulk loading completions for', assignmentIds.length, 'assignments');
      
      const { data, error } = await supabase
        .from('workout_completions')
        .select('*')
        .in('assignment_id', assignmentIds)
        .order('scheduled_date', { ascending: false });

      if (error) throw error;
      
      console.log('📊 ActivePrograms: Loaded completions:', data?.length || 0);
      setWorkoutCompletions(data || []);
    } catch (error) {
      console.error('❌ ActivePrograms: Error loading workout completions:', error);
    }
  }, []); // stable - uses ref

  // Initial load when programs change
  useEffect(() => {
    if (activePrograms.length > 0) {
      loadCompletions();
    }
  }, [activePrograms.length, loadCompletions]);

  // Enhanced real-time subscription via shared hook
  useRealtimePrograms({
    onProgramsChange: () => {
      console.log('🔄 Admin ActivePrograms: Programs changed');
      refetch();
    },
    onAssignmentsChange: async () => {
      console.log('🔄 Admin ActivePrograms: Assignments/completions changed');
      setRealtimeKey(Date.now() + Math.random());
      completionsCache.clearCache();
      await loadCompletions();
      refetch();
    },
  });

  // Χειρισμός κλικ σε πρόγραμμα - always show the clicked one
  const handleProgramClick = (assignment: EnrichedAssignment) => {
    openWorkout(assignment, dayToShow);
    setActiveAssignmentId(assignment.id);
  };

  const handleDialogClose = (assignmentId?: string) => {
    // Remove from activeWorkouts tracking
    if (assignmentId) {
      const dateStr = format(dayToShow, 'yyyy-MM-dd');
      const workoutId = `${assignmentId}-${dateStr}`;
      removeWorkout(workoutId);
    }
    // Only clear if this is still the active assignment (prevents race condition when switching bubbles)
    setActiveAssignmentId(prev => {
      if (assignmentId && prev !== assignmentId) return prev;
      return null;
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

  // Handle loading states
  if (authLoading || rolesLoading) {
    return <CustomLoadingScreen />;
  }

  // Handle redirection
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (!hasCheckedRedirect) {
    return <CustomLoadingScreen />;
  }

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    }
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
    <div className="h-screen bg-gray-50 flex w-full overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      </div>

      {/* Mobile/Tablet Sidebar Overlay */}
      {showMobileSidebar && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowMobileSidebar(false)} />
          <div className="fixed left-0 top-0 h-full w-80 bg-white shadow-lg">
            <Sidebar isCollapsed={false} setIsCollapsed={() => {}} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Mobile/Tablet Header */}
        <div className="lg:hidden bg-white border-b border-gray-200 p-3 sm:p-4">
          <div className="flex items-center justify-between">
            {/* Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMobileSidebar(true)}
              className="rounded-none flex items-center gap-2"
            >
              <Menu className="h-5 w-5" />
              <span className="text-sm font-medium">Μενού</span>
            </Button>
            
            {/* User Info & Logout */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {userProfile && (
                <span className="text-xs sm:text-sm text-gray-600 max-w-[120px] sm:max-w-none truncate">
                  {userProfile.display_name || 'Διαχειριστής'}
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="rounded-none flex items-center gap-1"
              >
                <LogOut className="h-4 w-4" />
                <span className="text-xs sm:text-sm">Έξοδος</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Header - Compact */}
          <div className="px-3 py-1 sm:px-4 md:px-6">
            <ActiveProgramsHeader />
          </div>

          {/* Calendar - Fill remaining space */}
          <div className="flex-1 min-h-0">
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

          {/* Today's Bubbles */}
          <TodaysBubbles
            programsForToday={programsForToday}
            workoutCompletions={workoutCompletions}
            todayStr={todayStr}
            onProgramClick={handleProgramClick}
            openAssignmentIds={activeAssignmentId ? new Set([activeAssignmentId]) : new Set()}
            onBubbleRestore={(assignmentId) => setActiveAssignmentId(assignmentId)}
            liveWorkouts={liveWorkouts}
          />
        </div>
      </div>

      {/* Multiple Day Program Dialogs */}
      {activeWorkouts.map(workout => {
        const isThisOpen = activeAssignmentId === workout.assignment.id;
        return (
          <DayProgramDialog
            key={workout.id}
            isOpen={isThisOpen}
            onClose={() => setActiveAssignmentId(prev => prev === workout.assignment.id ? null : prev)}
            program={workout.assignment}
            selectedDate={workout.selectedDate}
            workoutStatus={getWorkoutStatus(workout.assignment, format(workout.selectedDate, 'yyyy-MM-dd'))}
            onRefresh={handleCalendarRefresh}
            onMinimize={() => setActiveAssignmentId(prev => prev === workout.assignment.id ? null : prev)}
          />
        );
      })}
    </div>
  );
};

export default ActivePrograms;
