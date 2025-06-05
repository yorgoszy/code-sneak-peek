
import { useState } from 'react';
import { format } from "date-fns";
import { useWorkoutCompletions } from "@/hooks/useWorkoutCompletions";
import { usePrograms } from "@/hooks/usePrograms";
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

export const useProgramCardActions = (assignment: EnrichedAssignment, onRefresh?: () => void) => {
  const [dayProgramDialogOpen, setDayProgramDialogOpen] = useState(false);
  const [programViewDialogOpen, setProgramViewDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [daySelectorOpen, setDaySelectorOpen] = useState(false);
  const [attendanceOpen, setAttendanceOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  const { getWorkoutCompletions } = useWorkoutCompletions();
  const { saveProgram } = usePrograms();

  const handleStart = () => {
    // Άνοιγμα του DaySelector για επιλογή ημέρας
    setDaySelectorOpen(true);
  };

  const handleDaySelected = async (weekIndex: number, dayIndex: number) => {
    setDaySelectorOpen(false);
    
    // Βρίσκουμε την ημερομηνία για την επιλεγμένη ημέρα
    const trainingDates = assignment.training_dates || [];
    if (trainingDates.length > 0) {
      // Υπολογίζουμε ποια ημερομηνία αντιστοιχεί στην επιλεγμένη εβδομάδα/ημέρα
      const program = assignment.programs;
      if (program?.program_weeks?.[0]?.program_days) {
        const daysPerWeek = program.program_weeks[0].program_days.length;
        const totalDayIndex = (weekIndex * daysPerWeek) + dayIndex;
        
        if (totalDayIndex < trainingDates.length) {
          const dateStr = trainingDates[totalDayIndex];
          setSelectedDate(new Date(dateStr));
          setDayProgramDialogOpen(true);
        }
      }
    }
  };

  const handleStartWorkoutFromView = async (weekIndex: number, dayIndex: number) => {
    // Ίδια λογική με το handleDaySelected αλλά καλείται από το ProgramViewDialog
    const trainingDates = assignment.training_dates || [];
    if (trainingDates.length > 0) {
      const program = assignment.programs;
      if (program?.program_weeks?.[0]?.program_days) {
        const daysPerWeek = program.program_weeks[0].program_days.length;
        const totalDayIndex = (weekIndex * daysPerWeek) + dayIndex;
        
        if (totalDayIndex < trainingDates.length) {
          const dateStr = trainingDates[totalDayIndex];
          setSelectedDate(new Date(dateStr));
          setDayProgramDialogOpen(true);
        }
      }
    }
  };

  const handleView = () => {
    setProgramViewDialogOpen(true);
  };

  const handleEdit = () => {
    setEditDialogOpen(true);
  };

  const handleComplete = () => {
    setAttendanceOpen(true);
  };

  const handleEditSave = async (programData: any) => {
    try {
      await saveProgram(programData);
      setEditDialogOpen(false);
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error saving program:', error);
    }
  };

  const getWorkoutStatus = async () => {
    if (!selectedDate) return 'not_started';
    
    try {
      const completions = await getWorkoutCompletions(assignment.id);
      const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
      
      const completion = completions.find(c => 
        c.scheduled_date === selectedDateStr && c.status === 'completed'
      );
      
      return completion ? 'completed' : 'not_started';
    } catch (error) {
      console.error('Error getting workout status:', error);
      return 'not_started';
    }
  };

  const handleDialogClose = () => {
    setDayProgramDialogOpen(false);
    setSelectedDate(null);
    if (onRefresh) {
      onRefresh();
    }
  };

  return {
    // State
    dayProgramDialogOpen,
    programViewDialogOpen,
    selectedDate,
    daySelectorOpen,
    attendanceOpen,
    editDialogOpen,
    
    // Handlers
    handleStart,
    handleDaySelected,
    handleView,
    handleEdit,
    handleComplete,
    handleEditSave,
    getWorkoutStatus,
    handleDialogClose,
    handleStartWorkoutFromView,
    
    // Dialog close handlers
    onDaySelectorClose: () => setDaySelectorOpen(false),
    onProgramViewClose: () => setProgramViewDialogOpen(false),
    onAttendanceClose: () => setAttendanceOpen(false),
    onEditDialogClose: () => setEditDialogOpen(false)
  };
};
