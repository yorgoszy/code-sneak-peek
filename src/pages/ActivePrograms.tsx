
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { useActivePrograms } from "@/hooks/useActivePrograms";
import { ActiveProgramsHeader } from "@/components/active-programs/ActiveProgramsHeader";
import { TodaysProgramsSection } from "@/components/active-programs/TodaysProgramsSection";
import { ActiveProgramsSidebar } from "@/components/active-programs/ActiveProgramsSidebar";
import { CalendarGrid } from "@/components/active-programs/calendar/CalendarGrid";
import { DayProgramDialog } from "@/components/active-programs/calendar/DayProgramDialog";
import { DayAllProgramsDialog } from "@/components/active-programs/calendar/DayAllProgramsDialog";
import { ProgramViewDialog } from "@/components/active-programs/calendar/ProgramViewDialog";
import { MultiWorkoutManager } from "@/components/active-programs/calendar/MultiWorkoutManager";
import { AttendanceDialog } from "@/components/active-programs/AttendanceDialog";
import { useWorkoutCompletions } from "@/hooks/useWorkoutCompletions";
import { useMultipleWorkouts } from "@/hooks/useMultipleWorkouts";
import { CustomLoadingScreen } from "@/components/ui/custom-loading";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { useIsMobile } from "@/hooks/use-mobile";
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

const ActivePrograms = () => {
  const { user, loading: authLoading, signOut, isAuthenticated } = useAuth();
  const { isAdmin, userProfile, loading: rolesLoading } = useRoleCheck();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<EnrichedAssignment | null>(null);
  const [isProgramViewOpen, setIsProgramViewOpen] = useState(false);
  const [isDayDialogOpen, setIsDayDialogOpen] = useState(false);
  const [isDayAllProgramsOpen, setIsDayAllProgramsOpen] = useState(false);
  const [workoutStatus, setWorkoutStatus] = useState<string>('not_started');
  const [attendanceDialogData, setAttendanceDialogData] = useState<{isOpen: boolean, assignment: EnrichedAssignment | null}>({
    isOpen: false,
    assignment: null
  });
  const isMobile = useIsMobile();

  const activeProgramsData = useActivePrograms();
  const { data: workoutCompletionsData } = useWorkoutCompletions();
  const multipleWorkoutsData = useMultipleWorkouts();

  // Extract data safely
  const activePrograms = activeProgramsData?.data || [];
  const stats = activeProgramsData?.stats || {};
  const todaysPrograms = activeProgramsData?.todaysPrograms || [];
  const loading = activeProgramsData?.isLoading || false;
  const error = activeProgramsData?.error || null;
  const refreshData = activeProgramsData?.refetch || (() => {});

  const getWorkoutStatus = workoutCompletionsData?.getWorkoutStatus || (() => Promise.resolve('not_started'));

  const multiWorkoutState = multipleWorkoutsData?.state || { activeWorkouts: [], minimizedWorkout: null };
  const handleStartWorkout = multipleWorkoutsData?.startWorkout || (() => {});
  const handleCloseWorkout = multipleWorkoutsData?.closeWorkout || (() => {});
  const handleMinimizeWorkout = multipleWorkoutsData?.minimizeWorkout || (() => {});
  const handleRestoreWorkout = multipleWorkoutsData?.restoreWorkout || (() => {});
  const handleCancelMinimizedWorkout = multipleWorkoutsData?.cancelMinimizedWorkout || (() => {});

  useEffect(() => {
    if (selectedDate && selectedProgram) {
      const checkWorkoutStatus = async () => {
        try {
          const status = await getWorkoutStatus(selectedProgram.id, selectedDate);
          setWorkoutStatus(status || 'not_started');
        } catch (error) {
          console.error('Error checking workout status:', error);
          setWorkoutStatus('not_started');
        }
      };
      checkWorkoutStatus();
    }
  }, [selectedDate, selectedProgram, getWorkoutStatus]);

  if (authLoading || rolesLoading) {
    return <CustomLoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin()) {
    return <Navigate to={`/dashboard/user-profile/${userProfile?.id}`} replace />;
  }

  const handleProgramClick = (assignment: EnrichedAssignment) => {
    console.log('🎯 Program clicked:', assignment.id, assignment.app_users?.name);
    setSelectedProgram(assignment);
    setIsProgramViewOpen(true);
  };

  const handleDayClick = (date: Date, programsForDay: EnrichedAssignment[]) => {
    console.log('📅 Day clicked:', date, 'Programs:', programsForDay.length);
    setSelectedDate(date);
    
    if (programsForDay.length === 1) {
      setSelectedProgram(programsForDay[0]);
      setIsDayDialogOpen(true);
    } else if (programsForDay.length > 1) {
      setIsDayAllProgramsOpen(true);
    }
  };

  const handleWorkoutStart = (weekIndex: number, dayIndex: number) => {
    if (selectedProgram) {
      console.log('🏃‍♂️ Starting workout for program:', selectedProgram.id, 'Week:', weekIndex, 'Day:', dayIndex);
      handleStartWorkout(selectedProgram, weekIndex, dayIndex);
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    console.log('🗑️ Delete assignment requested for:', assignmentId);
    refreshData();
  };

  const handleAttendance = (assignment: EnrichedAssignment) => {
    setAttendanceDialogData({ isOpen: true, assignment });
  };

  if (loading) {
    return <CustomLoadingScreen />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Σφάλμα: {String(error)}</p>
          <button 
            onClick={refreshData}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Δοκιμάστε ξανά
          </button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-50 flex w-full">
        <ActiveProgramsSidebar 
          isCollapsed={isCollapsed} 
          setIsCollapsed={setIsCollapsed}
          stats={stats}
          activePrograms={activePrograms}
          onRefresh={refreshData}
          onDelete={handleDeleteAssignment}
          minimizedWorkout={multiWorkoutState.minimizedWorkout}
          onRestoreWorkout={handleRestoreWorkout}
          onCancelMinimizedWorkout={handleCancelMinimizedWorkout}
        />

        <SidebarInset className="flex-1 flex flex-col">
          <ActiveProgramsHeader
            userProfile={userProfile}
            user={user}
            onSignOut={signOut}
          />

          <div className={`flex-1 ${isMobile ? 'p-3' : 'p-6'} space-y-6`}>
            {/* Today's Programs Section */}
            <TodaysProgramsSection
              programs={todaysPrograms}
              onRefresh={refreshData}
              onProgramClick={handleProgramClick}
              onAttendance={handleAttendance}
            />

            {/* Calendar Grid */}
            <CalendarGrid
              programs={activePrograms}
              onDayClick={handleDayClick}
              onProgramClick={handleProgramClick}
            />
          </div>
        </SidebarInset>
      </div>

      {/* Dialogs */}
      <ProgramViewDialog
        isOpen={isProgramViewOpen}
        onClose={() => {
          setIsProgramViewOpen(false);
          setSelectedProgram(null);
        }}
        assignment={selectedProgram}
        onStartWorkout={handleWorkoutStart}
      />

      <DayProgramDialog
        isOpen={isDayDialogOpen}
        onClose={() => {
          setIsDayDialogOpen(false);
          setSelectedDate(null);
          setSelectedProgram(null);
        }}
        program={selectedProgram}
        selectedDate={selectedDate}
        workoutStatus={workoutStatus}
        onRefresh={refreshData}
      />

      <DayAllProgramsDialog
        isOpen={isDayAllProgramsOpen}
        onClose={() => {
          setIsDayAllProgramsOpen(false);
          setSelectedDate(null);
        }}
        selectedDate={selectedDate}
        programs={activePrograms}
        onProgramSelect={(program) => {
          setSelectedProgram(program);
          setIsDayAllProgramsOpen(false);
          setIsDayDialogOpen(true);
        }}
      />

      <AttendanceDialog
        isOpen={attendanceDialogData.isOpen}
        onClose={() => setAttendanceDialogData({ isOpen: false, assignment: null })}
        assignment={attendanceDialogData.assignment}
        onRefresh={refreshData}
      />

      {/* Multi-Workout Manager */}
      <MultiWorkoutManager
        activeWorkouts={multiWorkoutState.activeWorkouts}
        onCloseWorkout={handleCloseWorkout}
        onMinimizeWorkout={handleMinimizeWorkout}
      />
    </SidebarProvider>
  );
};

export default ActivePrograms;
