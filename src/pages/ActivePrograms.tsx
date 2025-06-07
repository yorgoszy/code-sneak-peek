
import React, { useState, useEffect } from 'react';
import { CalendarCheck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User, Play } from "lucide-react";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import { ActiveProgramsSidebar } from "@/components/active-programs/ActiveProgramsSidebar";
import { DayProgramDialog } from "@/components/active-programs/calendar/DayProgramDialog";
import { CalendarGrid } from "@/components/active-programs/calendar/CalendarGrid";
import { useNavigate } from "react-router-dom";
import { useActivePrograms } from "@/hooks/useActivePrograms";
import { useWorkoutCompletions } from "@/hooks/useWorkoutCompletions";
import { useRunningWorkouts } from "@/hooks/useRunningWorkouts";
import { supabase } from "@/integrations/supabase/client";

const ActivePrograms = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [workoutCompletions, setWorkoutCompletions] = useState<any[]>([]);
  const [dayDialogOpen, setDayDialogOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<any>(null);
  const [realtimeKey, setRealtimeKey] = useState(0);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const navigate = useNavigate();

  const { data: activePrograms = [], isLoading, error, refetch } = useActivePrograms();
  const { getWorkoutCompletions } = useWorkoutCompletions();
  const { startWorkout } = useRunningWorkouts();

  // Σημερινή ημερομηνία
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  // Φιλτράρουμε τα προγράμματα για σήμερα
  const programsForToday = activePrograms.filter(assignment => {
    if (!assignment.training_dates) return false;
    return assignment.training_dates.includes(todayStr);
  });

  // Φόρτωση workout completions
  const loadCompletions = async () => {
    if (activePrograms.length === 0) return;
    
    try {
      const allCompletions = [];
      for (const assignment of activePrograms) {
        const completions = await getWorkoutCompletions(assignment.id);
        allCompletions.push(...completions);
      }
      setWorkoutCompletions(allCompletions);
    } catch (error) {
      console.error('Error loading workout completions:', error);
    }
  };

  useEffect(() => {
    loadCompletions();
  }, [activePrograms, getWorkoutCompletions, realtimeKey]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('workout-completions-enhanced-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workout_completions'
        },
        async (payload) => {
          setRealtimeKey(prev => prev + 1);
          setTimeout(async () => {
            await refetch();
            await loadCompletions();
          }, 100);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  // Υπολογίζουμε τα stats για σήμερα
  const todayStats = {
    scheduled: programsForToday.length,
    completed: workoutCompletions.filter(c => 
      c.scheduled_date === todayStr && c.status === 'completed'
    ).length,
    missed: workoutCompletions.filter(c => 
      c.scheduled_date === todayStr && c.status === 'missed'
    ).length
  };

  const handleProgramClick = (assignment: any) => {
    setSelectedProgram(assignment);
    setDayDialogOpen(true);
  };

  const handleStartWorkout = () => {
    if (selectedProgram) {
      startWorkout(selectedProgram, today);
    }
  };

  const handleDeleteProgram = async (assignmentId: string) => {
    try {
      console.log('Διαγραφή προγράμματος:', assignmentId);
      refetch();
    } catch (error) {
      console.error('Σφάλμα κατά τη διαγραφή:', error);
    }
  };

  const getWorkoutStatus = (assignment: any) => {
    const completion = workoutCompletions.find(c => 
      c.assignment_id === assignment.id && c.scheduled_date === todayStr
    );
    return completion?.status || 'scheduled';
  };

  const handleNameClick = (program: any, event: React.MouseEvent) => {
    // This function is passed to CalendarGrid but not used anymore
    // since CalendarGrid now handles its own DayProgramDialog
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
    <>
      <div className="min-h-screen bg-gray-50 flex w-full">
        {/* Sidebar */}
        <ActiveProgramsSidebar 
          isCollapsed={isCollapsed} 
          setIsCollapsed={setIsCollapsed}
          stats={{
            totalPrograms: activePrograms.length,
            activeToday: todayStats.scheduled,
            completedToday: todayStats.completed
          }}
          activePrograms={activePrograms}
          onRefresh={refetch}
          onDelete={handleDeleteProgram}
        />
        
        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/dashboard')}
                  className="rounded-none"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Επιστροφή
                </Button>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <CalendarCheck className="h-8 w-8 text-[#00ffba]" />
                  Ενεργά Προγράμματα
                </h1>
              </div>
            </div>

            {/* Today's Stats */}
            <div className="grid grid-cols-4 gap-4">
              <Card className="rounded-none">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{todayStats.scheduled}</div>
                    <div className="text-sm text-gray-600">Προγραμματισμένες Σήμερα</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="rounded-none">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#00ffba]">{todayStats.completed}</div>
                    <div className="text-sm text-gray-600">Ολοκληρωμένες Σήμερα</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="rounded-none">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{todayStats.missed}</div>
                    <div className="text-sm text-gray-600">Χαμένες Σήμερα</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-none">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{activePrograms.length}</div>
                    <div className="text-sm text-gray-600">Σύνολο Ενεργών</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Calendar */}
            <CalendarGrid
              currentMonth={currentMonth}
              setCurrentMonth={setCurrentMonth}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              activePrograms={activePrograms}
              workoutCompletions={workoutCompletions}
              realtimeKey={realtimeKey}
              onNameClick={handleNameClick}
            />

            {/* Today's Programs (as additional section) */}
            <Card className="rounded-none">
              <CardHeader>
                <CardTitle>Προγράμματα Σήμερα</CardTitle>
              </CardHeader>
              <CardContent>
                {programsForToday.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Δεν υπάρχουν προγραμματισμένες προπονήσεις για σήμερα
                  </div>
                ) : (
                  <div className="space-y-3">
                    {programsForToday.map(assignment => {
                      const status = getWorkoutStatus(assignment);
                      
                      return (
                        <div
                          key={assignment.id}
                          onClick={() => handleProgramClick(assignment)}
                          className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-none hover:shadow-md transition-shadow cursor-pointer"
                        >
                          <div className="flex items-center gap-4">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={assignment.app_users?.photo_url || undefined} />
                              <AvatarFallback className="bg-gray-200">
                                <User className="w-6 h-6 text-gray-500" />
                              </AvatarFallback>
                            </Avatar>
                            
                            <div>
                              <h4 className="font-medium">{assignment.app_users?.name}</h4>
                              <p className="text-sm text-gray-600">{assignment.programs?.name}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className={`px-2 py-1 rounded-none text-xs ${
                              status === 'completed' ? 'bg-[#00ffba]/10 text-[#00ffba]' :
                              status === 'missed' ? 'bg-red-100 text-red-600' :
                              'bg-blue-100 text-blue-600'
                            }`}>
                              {status === 'completed' ? 'Ολοκληρωμένη' :
                               status === 'missed' ? 'Χαμένη' : 'Προγραμματισμένη'}
                            </div>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded-none"
                              title="Προβολή Προπόνησης"
                            >
                              <Play className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Day Program Dialog */}
      <DayProgramDialog
        isOpen={dayDialogOpen}
        onClose={() => setDayDialogOpen(false)}
        program={selectedProgram}
        selectedDate={today}
        workoutStatus={selectedProgram ? getWorkoutStatus(selectedProgram) : 'scheduled'}
        onRefresh={() => {
          refetch();
          setRealtimeKey(prev => prev + 1);
        }}
        onMinimize={handleStartWorkout}
      />
    </>
  );
};

export default ActivePrograms;
