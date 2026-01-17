import React, { useState, useEffect, useCallback } from 'react';
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { CalendarGrid } from "@/components/active-programs/calendar/CalendarGrid";
import { ActiveProgramsHeader } from "@/components/active-programs/ActiveProgramsHeader";
import { TodaysProgramsSection } from "@/components/active-programs/TodaysProgramsSection";
import { DayProgramDialog } from "@/components/active-programs/calendar/DayProgramDialog";
import { useWorkoutCompletions } from "@/hooks/useWorkoutCompletions";
import { workoutStatusService } from "@/hooks/useWorkoutCompletions/workoutStatusService";
import { supabase } from "@/integrations/supabase/client";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { CoachLayout } from "@/components/layouts/CoachLayout";
import { useCoachContext } from "@/contexts/CoachContext";
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

const CoachActiveProgramsContent = () => {
  const { coachId } = useCoachContext();
  const { isAdmin } = useRoleCheck();
  const navigate = useNavigate();
  
  const [activePrograms, setActivePrograms] = useState<EnrichedAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [workoutCompletions, setWorkoutCompletions] = useState<any[]>([]);
  const [realtimeKey, setRealtimeKey] = useState(0);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Απλό dialog state - χωρίς περίπλοκη λογική
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<EnrichedAssignment | null>(null);
  const [selectedDialogDate, setSelectedDialogDate] = useState<Date>(new Date());

  const { getWorkoutCompletions } = useWorkoutCompletions();

  useEffect(() => {
    if (isAdmin() && !coachId) {
      toast.info('Επιλέξτε coach (coachId) για να δείτε coach προγράμματα');
      navigate('/dashboard/active-programs');
      return;
    }

    const fetchCoachPrograms = async () => {
      if (!coachId) return;

      try {
        const { data: assignments, error: assignError } = await supabase
          .from('program_assignments')
          .select(`
            *,
            programs!fk_program_assignments_program_id (
              *,
              program_weeks!fk_program_weeks_program_id (
                *,
                program_days!fk_program_days_week_id (
                  *,
                  program_blocks!fk_program_blocks_day_id (
                    *,
                    program_exercises!fk_program_exercises_block_id (
                      *,
                      exercises!fk_program_exercises_exercise_id (*)
                    )
                  )
                )
              )
            ),
            app_users!fk_program_assignments_user_id (*)
          `)
          .eq('coach_id', coachId)
          .in('status', ['active', 'completed']);

        if (assignError) throw assignError;
        setActivePrograms((assignments || []) as unknown as EnrichedAssignment[]);
      } catch (error: any) {
        console.error('Error fetching coach programs:', error);
        toast.error(`Σφάλμα φόρτωσης προγραμμάτων coach`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCoachPrograms();
  }, [coachId, isAdmin, navigate]);

  useEffect(() => {
    workoutStatusService.markMissedWorkoutsForPastDates().catch(console.error);
  }, []);


  const dayToShow = selectedDate || new Date();
  const dayToShowStr = format(dayToShow, 'yyyy-MM-dd');
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const programsForSelectedDate = activePrograms.filter(assignment => {
    if (!assignment.training_dates) return false;
    const hasDateScheduled = assignment.training_dates.includes(dayToShowStr);
    if (assignment.status === 'completed' && dayToShowStr > todayStr) return false;
    return hasDateScheduled;
  });

  const loadCompletions = useCallback(async () => {
    if (activePrograms.length === 0) return;
    
    try {
      const allCompletions = [];
      for (const assignment of activePrograms) {
        const completions = await getWorkoutCompletions(assignment.id);
        allCompletions.push(...completions);
      }
      setWorkoutCompletions(allCompletions);
    } catch (error) {
      console.error('❌ Error loading workout completions:', error);
    }
  }, [activePrograms, getWorkoutCompletions]);

  useEffect(() => {
    loadCompletions();
  }, [loadCompletions]);

  const handleProgramClick = (assignment: EnrichedAssignment) => {
    console.log('🎯 handleProgramClick called:', assignment.id, 'date:', selectedDate);
    setSelectedProgram(assignment);
    setSelectedDialogDate(selectedDate);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  const getWorkoutStatus = (assignment: any, dateStr: string) => {
    const completion = workoutCompletions.find(c => 
      c.assignment_id === assignment.id && c.scheduled_date === dateStr
    );
    return completion?.status || 'scheduled';
  };

  const handleCalendarRefresh = useCallback(async () => {
    setRealtimeKey(Date.now() + Math.random());
    await loadCompletions();
  }, [loadCompletions]);

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Φόρτωση προγραμμάτων...</div>;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <ActiveProgramsHeader />

      <CalendarGrid
        currentMonth={currentMonth}
        setCurrentMonth={setCurrentMonth}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        activePrograms={activePrograms}
        workoutCompletions={workoutCompletions}
        realtimeKey={realtimeKey}
        onNameClick={handleProgramClick}
        onRefresh={handleCalendarRefresh}
      />

      <TodaysProgramsSection
        programsForToday={programsForSelectedDate}
        workoutCompletions={workoutCompletions}
        todayStr={dayToShowStr}
        onProgramClick={handleProgramClick}
      />

      {/* Απλό DayProgramDialog */}
      <DayProgramDialog
        isOpen={dialogOpen}
        onClose={handleDialogClose}
        program={selectedProgram}
        selectedDate={selectedDialogDate}
        workoutStatus={selectedProgram ? getWorkoutStatus(selectedProgram, format(selectedDialogDate, 'yyyy-MM-dd')) : 'scheduled'}
        onRefresh={handleCalendarRefresh}
      />
    </div>
  );
};

const CoachActiveProgramsPage = () => {
  return (
    <CoachLayout title="Ενεργά Προγράμματα" ContentComponent={CoachActiveProgramsContent} />
  );
};

export default CoachActiveProgramsPage;
