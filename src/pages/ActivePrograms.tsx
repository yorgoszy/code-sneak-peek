
import React from 'react';
import { Sidebar } from "@/components/Sidebar";
import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useActivePrograms } from "@/hooks/useActivePrograms";
import { ActiveProgramsList } from "@/components/active-programs/ActiveProgramsList";
import { ProgramCalendar } from "@/components/active-programs/ProgramCalendar";

const ActivePrograms = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { programs, loading, refetch } = useActivePrograms();

  console.log('📋 ActivePrograms - programs:', programs.length, 'loading:', loading);

  if (loading) {
    return (
      <div className="min-h-screen flex w-full">
        <Sidebar isCollapsed={sidebarCollapsed} setIsCollapsed={setSidebarCollapsed} />
        <div className="flex-1 p-6">
          <div className="text-center py-8">Φόρτωση προγραμμάτων...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex w-full">
      <Sidebar isCollapsed={sidebarCollapsed} setIsCollapsed={setSidebarCollapsed} />
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Ενεργά Προγράμματα</h1>
            <p className="text-gray-600">Διαχείριση και παρακολούθηση ενεργών προγραμμάτων προπόνησης</p>
          </div>

          <Tabs defaultValue="list" className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-none">
              <TabsTrigger value="list" className="rounded-none">Λίστα Προγραμμάτων</TabsTrigger>
              <TabsTrigger value="calendar" className="rounded-none">Ημερολόγιο</TabsTrigger>
            </TabsList>
            
            <TabsContent value="list" className="mt-6">
              <Card className="rounded-none">
                <CardContent className="p-6">
                  <ActiveProgramsList programs={programs} onRefresh={refetch} />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="calendar" className="mt-6">
              <ProgramCalendar programs={programs} onRefresh={refetch} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ActivePrograms;
