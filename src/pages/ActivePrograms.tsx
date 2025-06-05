
import React, { useState, useEffect } from 'react';
import { CalendarCheck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ActiveProgramsSidebar } from "@/components/active-programs/ActiveProgramsSidebar";
import { DayProgramDialog } from "@/components/active-programs/calendar/DayProgramDialog";
import { CalendarGrid } from "@/components/active-programs/calendar/CalendarGrid";
import { ProgramsForDateCard } from "@/components/active-programs/calendar/ProgramsForDateCard";
import { useNavigate } from "react-router-dom";
import { useActivePrograms } from "@/hooks/useActivePrograms";
import { useWorkoutCompletions } from "@/hooks/useWorkoutCompletions";
import { supabase } from "@/integrations/supabase/client";

const ActivePrograms = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [workoutCompletions, setWorkoutCompletions] = useState<any[]>([]);
  const [dayDialogOpen, setDayDialogOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<any>(null);
  const [selectedDialogDate, setSelectedDialogDate] = useState<Date | null>(null);
  const [realtimeKey, setRealtimeKey] = useState(0);
  const navigate = useNavigate();

  const { data: activePrograms = [], isLoading, error, refetch } = useActivePrograms();
  const { getWorkoutCompletions } = useWorkoutCompletions();

  // Φιλτράρουμε τα προγράμματα για την επιλεγμένη ημερομηνία
  const programsForSelectedDate = activePrograms.filter(assignment => {
    if (!selectedDate || !assignment.training_dates) return false;
    
    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
    return assignment.training_dates.includes(selectedDateStr);
  });

  // Φόρτωση workout completions για όλα τα assignments
  const loadCompletions = async () => {
    if (activePrograms.length === 0) return;
    
    try {
      const allCompletions = [];
      for (const assignment of activePrograms) {
        const completions = await getWorkoutCompletions(assignment.id);
        allCompletions.push(...completions);
      }
      setWorkoutCompletions(allCompletions);
      console.log('✅ Loaded completions:', allCompletions.length);
    } catch (error) {
      console.error('Error loading workout completions:', error);
    }
  };

  useEffect(() => {
    loadCompletions();
  }, [activePrograms, getWorkoutCompletions, realtimeKey]);

  // Real-time subscription
  useEffect(() => {
    console.log('🔄 Setting up ENHANCED realtime subscription...');
    
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
          console.log('🚀 IMMEDIATE Real-time change detected:', payload);
          
          setRealtimeKey(prev => prev + 1);
          
          setTimeout(async () => {
            console.log('🔄 Force refreshing data...');
            await refetch();
            await loadCompletions();
          }, 100);
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 Cleaning up enhanced realtime subscription...');
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  // Υπολογίζουμε τα stats
  const stats = {
    totalPrograms: activePrograms.length,
    activeToday: programsForSelectedDate.length,
    completedToday: 0
  };

  const handleNameClick = (program: any, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedProgram(program.assignment);
    setSelectedDialogDate(new Date(program.date));
    setDayDialogOpen(true);
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
          stats={stats}
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
                  Ημερολόγιο
                </h1>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {/* Calendar Section */}
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

              {/* Programs List */}
              <ProgramsForDateCard
                selectedDate={selectedDate}
                programsForSelectedDate={programsForSelectedDate}
                onRefresh={refetch}
                onDelete={handleDeleteProgram}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Day Program Dialog */}
      <DayProgramDialog
        isOpen={dayDialogOpen}
        onClose={() => setDayDialogOpen(false)}
        program={selectedProgram}
        selectedDate={selectedDialogDate}
        workoutStatus={selectedProgram && selectedDialogDate ? getWorkoutStatus(selectedProgram, selectedDialogDate) : 'scheduled'}
        onRefresh={() => {
          refetch();
          setRealtimeKey(prev => prev + 1);
        }}
      />
    </>
  );
};

export default ActivePrograms;
