
import React from 'react';
import { Sidebar } from "@/components/Sidebar";
import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useActivePrograms } from "@/hooks/useActivePrograms";
import { ActiveProgramsList } from "@/components/active-programs/ActiveProgramsList";
import { CompletedProgramsList } from "@/components/active-programs/CompletedProgramsList";
import { ProgramCalendar } from "@/components/active-programs/ProgramCalendar";

const ActivePrograms = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('list');
  
  // Για τη λίστα: μόνο ενεργά προγράμματα (includeCompleted = false)
  const { programs: listPrograms, loading: listLoading, refetch: listRefetch } = useActivePrograms(false);
  
  // Για το ημερολόγιο: όλα τα προγράμματα (includeCompleted = true)
  const { programs: calendarPrograms, loading: calendarLoading, refetch: calendarRefetch } = useActivePrograms(true);
  
  // Για τα ολοκληρωμένα: όλα τα προγράμματα και φιλτράρουμε τα ολοκληρωμένα
  const completedPrograms = calendarPrograms.filter(program => program.progress === 100);

  console.log('📋 ActivePrograms - listPrograms:', listPrograms.length, 'calendarPrograms:', calendarPrograms.length, 'completedPrograms:', completedPrograms.length);

  const handleListRefresh = async () => {
    console.log('🔄 Refreshing list programs data...');
    await listRefetch();
  };

  const handleCalendarRefresh = async () => {
    console.log('🔄 Refreshing calendar programs data...');
    await calendarRefetch();
  };

  const handleRefreshAll = async () => {
    await listRefetch();
    await calendarRefetch();
  };

  const isLoading = activeTab === 'list' ? listLoading : calendarLoading;

  if (isLoading) {
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

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-none">
              <TabsTrigger value="list" className="rounded-none">Λίστα Προγραμμάτων</TabsTrigger>
              <TabsTrigger value="calendar" className="rounded-none">Ημερολόγιο</TabsTrigger>
            </TabsList>
            
            <TabsContent value="list" className="mt-6">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <Card className="rounded-none">
                  <CardContent className="p-6">
                    <ActiveProgramsList programs={listPrograms} onRefresh={handleListRefresh} />
                  </CardContent>
                </Card>
                
                <Card className="rounded-none">
                  <CardContent className="p-6">
                    <CompletedProgramsList programs={completedPrograms} onRefresh={handleRefreshAll} />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="calendar" className="mt-6">
              <ProgramCalendar programs={calendarPrograms} onRefresh={handleCalendarRefresh} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ActivePrograms;
