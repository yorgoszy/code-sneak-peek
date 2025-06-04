
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActiveProgramsList } from "@/components/active-programs/ActiveProgramsList";
import { CompletedProgramsList } from "@/components/active-programs/CompletedProgramsList";
import { ProgramCalendar } from "@/components/active-programs/ProgramCalendar";
import { EmptyProgramsState } from "@/components/active-programs/EmptyProgramsState";
import { MinimizedProgramsSidebar } from "@/components/active-programs/MinimizedProgramsSidebar";
import { DayProgramDialog } from "@/components/active-programs/calendar/DayProgramDialog";
import { Sidebar } from "@/components/Sidebar";
import { useActivePrograms } from "@/hooks/useActivePrograms";
import { useMinimizedPrograms } from "@/hooks/useMinimizedPrograms";

const ActivePrograms = () => {
  const { programs, loading, refetch } = useActivePrograms();
  const [activeTab, setActiveTab] = useState("calendar");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [restoredProgram, setRestoredProgram] = useState<{
    program: any;
    selectedDate: Date;
    workoutStatus: string;
    workoutState?: any;
  } | null>(null);
  
  const { getMinimizedProgram, removeMinimizedProgram } = useMinimizedPrograms();

  const activePrograms = programs.filter(p => p.status === 'active');
  const completedPrograms = programs.filter(p => p.status === 'completed');

  const handleRefresh = async () => {
    console.log('🔄 Refreshing all data...');
    await refetch();
  };

  const handleRestoreProgram = (programId: string) => {
    const minimizedProgram = getMinimizedProgram(programId);
    if (minimizedProgram) {
      console.log('🔄 Restoring program:', minimizedProgram);
      setRestoredProgram({
        program: minimizedProgram.program,
        selectedDate: minimizedProgram.selectedDate,
        workoutStatus: minimizedProgram.workoutStatus,
        workoutState: minimizedProgram.workoutState
      });
      removeMinimizedProgram(programId);
    }
  };

  const handleCloseRestoredProgram = () => {
    setRestoredProgram(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <div className="flex-1 container mx-auto p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Φόρτωση προγραμμάτων...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (programs.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <div className="flex-1 container mx-auto p-6">
          <EmptyProgramsState />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      
      <div className="flex flex-1">
        <div className="flex-1 container mx-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Ενεργά Προγράμματα</h1>
              <p className="text-gray-600 mt-1">
                Διαχειριστείτε και παρακολουθήστε τα ενεργά προγράμματα προπόνησης
              </p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 rounded-none">
              <TabsTrigger value="calendar" className="rounded-none">Ημερολόγιο</TabsTrigger>
              <TabsTrigger value="list" className="rounded-none">Ενεργά</TabsTrigger>
              <TabsTrigger value="completed" className="rounded-none">Ολοκληρωμένα</TabsTrigger>
            </TabsList>

            <TabsContent value="calendar" className="space-y-4">
              <ProgramCalendar programs={activePrograms} onRefresh={handleRefresh} />
            </TabsContent>

            <TabsContent value="list" className="space-y-4">
              <ActiveProgramsList programs={activePrograms} onRefresh={handleRefresh} />
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              <CompletedProgramsList programs={completedPrograms} onRefresh={handleRefresh} />
            </TabsContent>
          </Tabs>
        </div>

        <MinimizedProgramsSidebar onRestoreProgram={handleRestoreProgram} />
      </div>

      {restoredProgram && (
        <DayProgramDialog
          isOpen={true}
          onClose={handleCloseRestoredProgram}
          program={restoredProgram.program}
          selectedDate={restoredProgram.selectedDate}
          workoutStatus={restoredProgram.workoutStatus}
          onRefresh={handleRefresh}
          initialWorkoutState={restoredProgram.workoutState}
        />
      )}
    </div>
  );
};

export default ActivePrograms;
