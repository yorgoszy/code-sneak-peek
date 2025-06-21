
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
import { format, isToday } from "date-fns";
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

const ActivePrograms = () => {
  const { user, loading: authLoading, signOut, isAuthenticated } = useAuth();
  const { isAdmin, userProfile, loading: rolesLoading } = useRoleCheck();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedProgram, setSelectedProgram] = useState<EnrichedAssignment | null>(null);
  const [isProgramViewOpen, setIsProgramViewOpen] = useState(false);
  const [isDayDialogOpen, setIsDayDialogOpen] = useState(false);
  const [isDayAllProgramsOpen, setIsDayAllProgramsOpen] = useState(false);
  const [workoutStatus, setWorkoutStatus] = useState<string>('not_started');
  const [attendanceDialogData, setAttendanceDialogData] = useState<{isOpen: boolean, assignment: EnrichedAssignment | null}>({
    isOpen: false,
    assignment: null
  });
  const [realtimeKey, setRealtimeKey] = useState(0);
  const isMobile = useIsMobile();

  const { data: activePrograms = [], isLoading: loading, error, refetch: refreshData } = useActivePrograms();
  const workoutCompletionsData = useWorkoutCompletions();
  const multipleWorkoutsData = useMultipleWorkouts();

  // Get workout completions data
  const workoutCompletions = [];

  // Calculate stats properly
  const stats = {
    totalPrograms: activePrograms.length,
    activeToday: 0,
    completedToday: 0
  };

  // Get today's programs
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const todaysPrograms = activePrograms.filter(assignment => {
    return assignment.training_dates?.some(date => date === todayStr);
  });

  const multiWorkoutState = { activeWorkouts: multipleWorkoutsData?.activeWorkouts || [] };
  const handleStartWorkout = multipleWorkoutsData?.startWorkout || (() => {});
  const handleCloseWorkout = () => {};
  const handleMinimizeWorkout = () => {};
  const handleRestoreWorkout = () => {};
  const handleCancelMinimizedWorkout = () => {};

  useEffect(() => {
    if (selectedDate && selectedProgram) {
      setWorkoutStatus('not_started');
    }
  }, [selectedDate, selectedProgram]);

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

  const handleNameClick = (programData: any, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedProgram(programData.assignment);
    setSelectedDate(new Date(programData.date));
    setIsDayDialogOpen(true);
  };

  const handleWorkoutStart = (weekIndex: number, dayIndex: number) => {
    if (selectedProgram && selectedDate) {
      console.log('🏃‍♂️ Starting workout for program:', selectedProgram.id, 'Week:', weekIndex, 'Day:', dayIndex);
      handleStartWorkout(selectedProgram, selectedDate);
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    console.log('🗑️ Delete assignment requested for:', assignmentId);
    refreshData();
  };

  const handleAttendance = (assignment: EnrichedAssignment) => {
    setAttendanceDialogData({ isOpen: true, assignment });
  };

  const handleRefresh = () => {
    refreshData();
    setRealtimeKey(prev => prev + 1);
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
            onClick={handleRefresh}
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
          onRefresh={handleRefresh}
          onDelete={handleDeleteAssignment}
          minimizedWorkout={null}
          onRestoreWorkout={handleRestoreWorkout}
          onCancelMinimizedWorkout={handleCancelMinimizedWorkout}
        />

        <SidebarInset className="flex-1 flex flex-col">
          <ActiveProgramsHeader />

          <div className={`flex-1 ${isMobile ? 'p-3' : 'p-6'} space-y-6`}>
            {/* Today's Programs Section */}
            <TodaysProgramsSection
              programsForToday={todaysPrograms}
              workoutCompletions={workoutCompletions}
              todayStr={todayStr}
              onProgramClick={handleProgramClick}
            />

            {/* Calendar Grid */}
            <CalendarGrid
              currentMonth={currentMonth}
              setCurrentMonth={setCurrentMonth}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              activePrograms={activePrograms}
              workoutCompletions={workoutCompletions}
              realtimeKey={realtimeKey}
              onNameClick={handleNameClick}
              onRefresh={handleRefresh}
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
        onRefresh={handleRefresh}
      />

      <DayAllProgramsDialog
        isOpen={isDayAllProgramsOpen}
        onClose={() => {
          setIsDayAllProgramsOpen(false);
          setSelectedDate(null);
        }}
        selectedDate={selectedDate}
        programs={activePrograms}
        allCompletions={[]}
        onProgramClick={(program) => {
          setSelectedProgram(program);
          setIsDayAllProgramsOpen(false);
          setIsDayDialogOpen(true);
        }}
      />

      <AttendanceDialog
        isOpen={attendanceDialogData.isOpen}
        onClose={() => setAttendanceDialogData({ isOpen: false, assignment: null })}
        assignment={attendanceDialogData.assignment}
      />

      {/* Multi-Workout Manager */}
      <MultiWorkoutManager
        onRefresh={handleRefresh}
      />
    </SidebarProvider>
  );
};

export default ActivePrograms;
