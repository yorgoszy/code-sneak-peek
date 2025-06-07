
import React, { useState, useEffect } from 'react';
import { CalendarCheck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User, Play } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import { el } from "date-fns/locale";
import { ActiveProgramsSidebar } from "@/components/active-programs/ActiveProgramsSidebar";
import { DayProgramDialog } from "@/components/active-programs/calendar/DayProgramDialog";
import { CalendarHeader } from "@/components/active-programs/calendar/CalendarHeader";
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
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentDate, setCurrentDate] = useState(new Date());
  const [realtimeKey, setRealtimeKey] = useState(0);
  const navigate = useNavigate();

  const { data: activePrograms = [], isLoading, error, refetch } = useActivePrograms();
  const { getWorkoutCompletions } = useWorkoutCompletions();
  const { startWorkout } = useRunningWorkouts();

  // Σημερινή ημερομηνία
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  // Υπολογίζουμε τις ημέρες του μήνα
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Φιλτράρουμε τα προγράμματα για κάθε μέρα
  const getProgramsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return activePrograms.filter(assignment => {
      if (!assignment.training_dates) return false;
      return assignment.training_dates.includes(dateStr);
    });
  };

  // Φιλτράρουμε τα προγράμματα για σήμερα
  const programsForToday = getProgramsForDate(today);

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

  const handleDayClick = (date: Date) => {
    const programsForDate = getProgramsForDate(date);
    if (programsForDate.length === 1) {
      setSelectedProgram(programsForDate[0]);
      setSelectedDate(date);
      setDayDialogOpen(true);
    } else if (programsForDate.length > 1) {
      // TODO: Open multi-program dialog
      console.log('Multiple programs for this date:', programsForDate);
    }
  };

  const handleStartWorkout = () => {
    if (selectedProgram && selectedDate) {
      startWorkout(selectedProgram, selectedDate);
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

  const getWorkoutStatus = (assignment: any, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const completion = workoutCompletions.find(c => 
      c.assignment_id === assignment.id && c.scheduled_date === dateStr
    );
    return completion?.status || 'scheduled';
  };

  const handlePreviousMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
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
                  Ημερολόγιο Προπονήσεων
                </h1>
              </div>
            </div>

            {/* Today's Stats */}
            <div className="grid grid-cols-4 gap-4">
              <Card className="rounded-none">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{todayStats.scheduled}</div>
                    <div className="text-sm text-gray-600">Σήμερα</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="rounded-none">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#00ffba]">{todayStats.completed}</div>
                    <div className="text-sm text-gray-600">Ολοκληρωμένες</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="rounded-none">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{todayStats.missed}</div>
                    <div className="text-sm text-gray-600">Χαμένες</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-none">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{format(today, 'dd')}</div>
                    <div className="text-sm text-gray-600">Σήμερα</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Calendar */}
            <Card className="rounded-none">
              <CardHeader>
                <CalendarHeader
                  currentDate={currentDate}
                  onPreviousMonth={handlePreviousMonth}
                  onNextMonth={handleNextMonth}
                />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2">
                  {/* Day headers */}
                  {['Δευ', 'Τρι', 'Τετ', 'Πεμ', 'Παρ', 'Σαβ', 'Κυρ'].map((day) => (
                    <div key={day} className="p-2 text-center text-sm font-medium text-gray-600 border-b">
                      {day}
                    </div>
                  ))}
                  
                  {/* Calendar days */}
                  {daysInMonth.map((date) => {
                    const programsForDate = getProgramsForDate(date);
                    const isToday = isSameDay(date, today);
                    
                    return (
                      <div
                        key={date.toISOString()}
                        onClick={() => handleDayClick(date)}
                        className={`p-2 min-h-[80px] border border-gray-200 rounded-none cursor-pointer hover:bg-gray-50 ${
                          isToday ? 'bg-blue-50 border-blue-300' : ''
                        }`}
                      >
                        <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : ''}`}>
                          {format(date, 'd')}
                        </div>
                        
                        {programsForDate.map((program) => {
                          const status = getWorkoutStatus(program, date);
                          return (
                            <div
                              key={program.id}
                              className={`text-xs p-1 mb-1 rounded-none truncate ${
                                status === 'completed' ? 'bg-[#00ffba]/20 text-[#00ffba]' :
                                status === 'missed' ? 'bg-red-100 text-red-600' :
                                'bg-blue-100 text-blue-600'
                              }`}
                            >
                              {program.app_users?.name}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
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
        selectedDate={selectedDate}
        workoutStatus={selectedProgram ? getWorkoutStatus(selectedProgram, selectedDate) : 'scheduled'}
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
