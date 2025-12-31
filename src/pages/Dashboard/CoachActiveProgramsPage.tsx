import React, { useState, useEffect, useCallback } from 'react';
import { format } from "date-fns";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { CalendarGrid } from "@/components/active-programs/calendar/CalendarGrid";
import { ActiveProgramsHeader } from "@/components/active-programs/ActiveProgramsHeader";
import { TodaysProgramsSection } from "@/components/active-programs/TodaysProgramsSection";
import { useMultipleWorkouts } from "@/hooks/useMultipleWorkouts";
import { DayProgramDialog } from "@/components/active-programs/calendar/DayProgramDialog";
import { useWorkoutCompletions } from "@/hooks/useWorkoutCompletions";
import { useWorkoutCompletionsCache } from "@/hooks/useWorkoutCompletionsCache";
import { workoutStatusService } from "@/hooks/useWorkoutCompletions/workoutStatusService";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { CustomLoadingScreen } from "@/components/ui/custom-loading";
import { CoachSidebar } from "@/components/CoachSidebar";
import { Button } from "@/components/ui/button";
import { LogOut, Menu } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

const CoachActiveProgramsPage = () => {
  const { user, loading: authLoading, signOut, isAuthenticated } = useAuth();
  const { userProfile, loading: rolesLoading, isAdmin } = useRoleCheck();
  const [searchParams] = useSearchParams();
  const coachIdFromUrl = searchParams.get('coachId');
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  // Για admin απαιτείται coachId στο URL
  // Για coach χρησιμοποιεί το δικό του ID
  const effectiveCoachId = (isAdmin() && coachIdFromUrl) 
    ? coachIdFromUrl 
    : (!isAdmin() ? userProfile?.id : null);

  const [activePrograms, setActivePrograms] = useState<EnrichedAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [workoutCompletions, setWorkoutCompletions] = useState<any[]>([]);
  const [realtimeKey, setRealtimeKey] = useState(0);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [openDialogs, setOpenDialogs] = useState<Set<string>>(new Set());

  const { getWorkoutCompletions } = useWorkoutCompletions();
  const completionsCache = useWorkoutCompletionsCache();
  
  const { 
    activeWorkouts, 
    startWorkout,
    updateElapsedTime,
    completeWorkout,
    cancelWorkout,
    getWorkout,
    formatTime
  } = useMultipleWorkouts();

  // Fetch coach's program assignments
  useEffect(() => {
    // Αν είμαστε admin χωρίς coachId, πάμε στο admin view
    if (isAdmin() && !coachIdFromUrl) {
      toast.info('Επιλέξτε coach (coachId) για να δείτε coach προγράμματα');
      navigate('/dashboard/active-programs');
      return;
    }

    const fetchCoachPrograms = async () => {
      if (!effectiveCoachId) return;

      try {
        // Τραβάμε program_assignments με app_users (όχι coach_users)
        const { data: assignments, error: assignError } = await supabase
          .from('program_assignments')
          .select(`
            *,
            programs!fk_program_assignments_program_id (
              *,
              program_weeks!fk_program_weeks_program_id (
                *,
                program_days!fk_program_days_week_id (
                  *,
                  program_blocks!fk_program_blocks_day_id (
                    *,
                    program_exercises!fk_program_exercises_block_id (
                      *,
                      exercises!fk_program_exercises_exercise_id (*)
                    )
                  )
                )
              )
            ),
            app_users!fk_program_assignments_user_id (*)
          `)
          .eq('coach_id', effectiveCoachId)
          .in('status', ['active', 'completed']);

        if (assignError) throw assignError;

        console.log('✅ Coach active programs loaded:', (assignments || []).length);
        setActivePrograms((assignments || []) as unknown as EnrichedAssignment[]);
      } catch (error: any) {
        console.error('Error fetching coach programs:', error);
        const message = error?.message || (typeof error === 'string' ? error : JSON.stringify(error));
        toast.error(`Σφάλμα φόρτωσης προγραμμάτων coach: ${message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCoachPrograms();
  }, [effectiveCoachId]);

  // Check for missed workouts
  useEffect(() => {
    const checkMissedWorkouts = async () => {
      try {
        await workoutStatusService.markMissedWorkoutsForPastDates();
      } catch (error) {
        console.error('❌ Error checking missed workouts:', error);
      }
    };
    checkMissedWorkouts();
  }, []);

  // Timer for active workouts
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
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const programsForSelectedDate = activePrograms.filter(assignment => {
    if (!assignment.training_dates) return false;
    const hasDateScheduled = assignment.training_dates.includes(dayToShowStr);
    if (assignment.status === 'completed' && dayToShowStr > todayStr) {
      return false;
    }
    return hasDateScheduled;
  });

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

  const handleProgramClick = (assignment: EnrichedAssignment) => {
    const workoutId = `${assignment.id}-${dayToShow.toISOString().split('T')[0]}`;
    startWorkout(assignment, dayToShow);
    setOpenDialogs(prev => new Set(prev).add(workoutId));
  };

  const handleDialogClose = (workoutId: string) => {
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
    setRealtimeKey(Date.now() + Math.random());
    await loadCompletions();
  }, [loadCompletions]);

  if (authLoading || rolesLoading) {
    return <CustomLoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
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

  return (
    <div className="min-h-screen bg-gray-50 flex w-full">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <CoachSidebar 
          isCollapsed={isCollapsed} 
          setIsCollapsed={setIsCollapsed}
          contextCoachId={effectiveCoachId || undefined}
        />
      </div>

      {/* Mobile/Tablet Sidebar Overlay */}
      {showMobileSidebar && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowMobileSidebar(false)} />
          <div className="fixed left-0 top-0 h-full w-80 bg-white shadow-lg">
            <CoachSidebar 
              isCollapsed={false} 
              setIsCollapsed={() => {}}
              contextCoachId={effectiveCoachId || undefined}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Mobile/Tablet Header */}
        <div className="lg:hidden bg-white border-b border-gray-200 p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMobileSidebar(true)}
              className="rounded-none flex items-center gap-2"
            >
              <Menu className="h-5 w-5" />
              <span className="text-sm font-medium">Μενού</span>
            </Button>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              {userProfile && (
                <span className="text-xs sm:text-sm text-gray-600 max-w-[120px] sm:max-w-none truncate">
                  {userProfile.name || 'Coach'}
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
        <div className="flex-1 space-y-4 sm:space-y-6">
          <div className="p-3 sm:p-4 md:p-6 pb-0">
            <ActiveProgramsHeader />
          </div>

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

          <div className="p-3 sm:p-4 md:p-6 pt-0">
            <TodaysProgramsSection
              programsForToday={programsForSelectedDate}
              workoutCompletions={workoutCompletions}
              todayStr={dayToShowStr}
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

export default CoachActiveProgramsPage;