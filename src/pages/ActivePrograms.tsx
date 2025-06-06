import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ActiveProgramsSidebar } from "@/components/active-programs/ActiveProgramsSidebar";
import { MobileNavigation } from "@/components/navigation/MobileNavigation";
import { CalendarGrid } from "@/components/active-programs/calendar/CalendarGrid";
import { ProgramsForDateCard } from "@/components/active-programs/calendar/ProgramsForDateCard";
import { DatabaseDebugger } from "@/components/debug/DatabaseDebugger";
import { useActivePrograms } from "@/hooks/useActivePrograms";
import { useWorkoutCompletionsCache } from "@/hooks/useWorkoutCompletionsCache";
import { format } from "date-fns";
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

const ActivePrograms = () => {
  const { user, loading, signOut, isAuthenticated } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [showDebugger, setShowDebugger] = useState(false);
  const [realtimeKey, setRealtimeKey] = useState(0);

  const { data: activePrograms = [], isLoading, error, refetch } = useActivePrograms();
  const { getAllWorkoutCompletions } = useWorkoutCompletionsCache();

  const [workoutCompletions, setWorkoutCompletions] = useState<any[]>([]);

  useEffect(() => {
    const loadCompletions = async () => {
      if (activePrograms.length > 0) {
        const allCompletions = await getAllWorkoutCompletions();
        // Filter completions for active programs
        const assignmentIds = activePrograms.map(p => p.id);
        const filteredCompletions = allCompletions.filter(c => assignmentIds.includes(c.assignment_id));
        setWorkoutCompletions(filteredCompletions);
      }
    };
    loadCompletions();
  }, [activePrograms, getAllWorkoutCompletions]);

  const stats = {
    totalPrograms: activePrograms.length,
    activeToday: activePrograms.filter(program =>
      program.training_dates?.includes(format(new Date(), 'yyyy-MM-dd'))
    ).length,
    completedToday: workoutCompletions.filter(completion =>
      completion.scheduled_date === format(new Date(), 'yyyy-MM-dd') && completion.status === 'completed'
    ).length,
  };

  const programsForSelectedDate = selectedDate 
    ? activePrograms.filter(assignment => {
        const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
        return assignment.training_dates?.includes(selectedDateStr);
      })
    : [];

  const getWorkoutStatusForDate = (assignmentId: string, dateStr: string) => {
    const completion = workoutCompletions.find(c => 
      c.assignment_id === assignmentId && c.scheduled_date === dateStr
    );
    return completion?.status || 'scheduled';
  };

  const handleRefresh = () => {
    refetch();
    setRealtimeKey(prev => prev + 1);
  };

  const handleDelete = async (assignmentId: string) => {
    // Optimistically remove the assignment from the local state
    // setActivePrograms(prevPrograms => prevPrograms.filter(p => p.id !== assignmentId));
    // setWorkoutCompletions(prevCompletions => prevCompletions.filter(c => c.assignment_id !== assignmentId));

    // Call the API to delete the assignment
    // await deleteAssignment(assignmentId);

    // Refresh the data to get the latest state from the server
    refetch();
    setRealtimeKey(prev => prev + 1);
  };

  const onNameClick = (program: any, event: React.MouseEvent) => {
    event.preventDefault();
    window.open(`/lovable-uploads/${program.video_url}`, '_blank');
  };

  const onToggleDebugger = () => {
    setShowDebugger(!showDebugger);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Φόρτωση...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <ActiveProgramsSidebar 
          isCollapsed={isCollapsed} 
          setIsCollapsed={setIsCollapsed}
          stats={stats}
          activePrograms={activePrograms}
          onRefresh={handleRefresh}
          onDelete={handleDelete}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        {/* Top Navigation */}
        <DashboardHeader
          userProfile={null}
          userEmail={user?.email}
          onSignOut={handleSignOut}
        />

        {/* Calendar Content */}
        <div className="flex-1 p-2 md:p-4 lg:p-6 overflow-hidden">
          {showDebugger && <DatabaseDebugger />}
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 md:gap-4 lg:gap-6 h-full">
            <div className="lg:col-span-2 min-h-0">
              <CalendarGrid
                currentMonth={currentMonth}
                setCurrentMonth={setCurrentMonth}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                activePrograms={activePrograms}
                workoutCompletions={workoutCompletions}
                realtimeKey={realtimeKey}
                onNameClick={onNameClick}
              />
            </div>
            
            <div className="lg:col-span-1 space-y-2 md:space-y-4 hidden lg:block">
              <ProgramsForDateCard
                selectedDate={selectedDate}
                programsForSelectedDate={programsForSelectedDate}
                onRefresh={handleRefresh}
                onDelete={handleDelete}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <MobileNavigation />
    </div>
  );
};

export default ActivePrograms;
