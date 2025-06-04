
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActiveProgramsList } from "@/components/active-programs/ActiveProgramsList";
import { CompletedProgramsList } from "@/components/active-programs/CompletedProgramsList";
import { ProgramCalendar } from "@/components/active-programs/ProgramCalendar";
import { ActiveProgramsActions } from "@/components/active-programs/ActiveProgramsActions";
import { EmptyProgramsState } from "@/components/active-programs/EmptyProgramsState";
import { MinimizedProgramsSidebar } from "@/components/active-programs/MinimizedProgramsSidebar";
import { DayProgramDialog } from "@/components/active-programs/calendar/DayProgramDialog";
import { useActivePrograms } from "@/hooks/useActivePrograms";
import { useMinimizedPrograms } from "@/hooks/useMinimizedPrograms";

const ActivePrograms = () => {
  const { programs, loading, refetch } = useActivePrograms();
  const [activeTab, setActiveTab] = useState("list");
  const [restoredProgram, setRestoredProgram] = useState<{
    program: any;
    selectedDate: Date;
    workoutStatus: string;
  } | null>(null);
  
  const { getMinimizedProgram, removeMinimizedProgram } = useMinimizedPrograms();

  const activePrograms = programs.filter(p => p.status === 'active');
  const completedPrograms = programs.filter(p => p.status === 'completed');

  const handleRestoreProgram = (programId: string) => {
    const minimizedProgram = getMinimizedProgram(programId);
    if (minimizedProgram) {
      setRestoredProgram({
        program: minimizedProgram.program,
        selectedDate: minimizedProgram.selectedDate,
        workoutStatus: minimizedProgram.workoutStatus
      });
      removeMinimizedProgram(programId);
    }
  };

  const handleCloseRestoredProgram = () => {
    setRestoredProgram(null);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Φόρτωση προγραμμάτων...</p>
          </div>
        </div>
      </div>
    );
  }

  if (programs.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <EmptyProgramsState />
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Ενεργά Προγράμματα</h1>
            <p className="text-gray-600 mt-1">
              Διαχειριστείτε και παρακολουθήστε τα ενεργά προγράμματα προπόνησης
            </p>
          </div>
          <ActiveProgramsActions onRefresh={refetch} />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 rounded-none">
            <TabsTrigger value="list" className="rounded-none">Λίστα</TabsTrigger>
            <TabsTrigger value="calendar" className="rounded-none">Ημερολόγιο</TabsTrigger>
            <TabsTrigger value="completed" className="rounded-none">Ολοκληρωμένα</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            <ActiveProgramsList programs={activePrograms} onRefresh={refetch} />
          </TabsContent>

          <TabsContent value="calendar" className="space-y-4">
            <ProgramCalendar programs={activePrograms} onRefresh={refetch} />
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            <CompletedProgramsList programs={completedPrograms} onRefresh={refetch} />
          </TabsContent>
        </Tabs>
      </div>

      <MinimizedProgramsSidebar onRestoreProgram={handleRestoreProgram} />

      {restoredProgram && (
        <DayProgramDialog
          isOpen={true}
          onClose={handleCloseRestoredProgram}
          program={restoredProgram.program}
          selectedDate={restoredProgram.selectedDate}
          workoutStatus={restoredProgram.workoutStatus}
          onRefresh={refetch}
        />
      )}
    </div>
  );
};

export default ActivePrograms;
