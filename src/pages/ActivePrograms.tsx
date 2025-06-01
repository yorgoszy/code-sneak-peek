
import React, { useState } from 'react';
import { Sidebar } from "@/components/Sidebar";
import { ActiveProgramsList } from "@/components/active-programs/ActiveProgramsList";
import { ProgramCalendar } from "@/components/active-programs/ProgramCalendar";
import { useActivePrograms } from "@/hooks/useActivePrograms";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ActivePrograms = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { programs, loading } = useActivePrograms();

  if (loading) {
    return (
      <div className="min-h-screen flex w-full">
        <Sidebar isCollapsed={sidebarCollapsed} setIsCollapsed={setSidebarCollapsed} />
        <div className="flex-1 p-6">
          <div className="text-center">Φόρτωση...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex w-full">
      <Sidebar isCollapsed={sidebarCollapsed} setIsCollapsed={setSidebarCollapsed} />
      <div className="flex-1 p-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ενεργά Προγράμματα</h1>
            <p className="text-gray-600">Προγράμματα που σας έχουν ανατεθεί και είναι ενεργά</p>
          </div>
          
          <Tabs defaultValue="calendar" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="calendar">Ημερολόγιο</TabsTrigger>
              <TabsTrigger value="list">Λίστα</TabsTrigger>
            </TabsList>
            
            <TabsContent value="calendar" className="space-y-4">
              <ProgramCalendar programs={programs} />
            </TabsContent>

            <TabsContent value="list" className="space-y-4">
              <ActiveProgramsList programs={programs} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ActivePrograms;
