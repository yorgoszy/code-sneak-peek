
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Eye, Edit, CheckCircle2 } from "lucide-react";
import { DayProgramDialog } from './calendar/DayProgramDialog';
import { DaySelector } from './DaySelector';
import { AttendanceDialog } from './AttendanceDialog';
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";
import { useWorkoutCompletions } from "@/hooks/useWorkoutCompletions";
import { format } from "date-fns";

interface ProgramCardActionsProps {
  assignment: EnrichedAssignment;
  onRefresh?: () => void;
}

export const ProgramCardActions: React.FC<ProgramCardActionsProps> = ({ assignment, onRefresh }) => {
  const [dayProgramDialogOpen, setDayProgramDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [daySelectorOpen, setDaySelectorOpen] = useState(false);
  const [attendanceOpen, setAttendanceOpen] = useState(false);
  const { getWorkoutCompletions } = useWorkoutCompletions();

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'completed': return 'secondary';
      case 'paused': return 'outline';
      default: return 'outline';
    }
  };

  const handleStart = () => {
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

  const handleView = () => {
    // Για προβολή, παίρνουμε την πρώτη διαθέσιμη ημερομηνία
    const trainingDates = assignment.training_dates || [];
    if (trainingDates.length > 0) {
      setSelectedDate(new Date(trainingDates[0]));
      setDayProgramDialogOpen(true);
    }
  };

  const handleEdit = () => {
    // TODO: Implement edit functionality
    console.log('Edit program:', assignment.id);
  };

  const handleComplete = () => {
    setAttendanceOpen(true);
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

  return (
    <>
      <div className="flex items-center gap-1 flex-shrink-0">
        {/* Status Badge */}
        <Badge 
          variant={getStatusBadgeVariant(assignment.status)} 
          className="rounded-none text-xs px-1 py-0"
        >
          {assignment.status === 'active' ? 'Ε' : assignment.status}
        </Badge>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-0.5">
          <Button 
            size="sm" 
            variant="outline" 
            className="rounded-none h-5 w-5 p-0"
            onClick={handleStart}
            title="Έναρξη"
          >
            <Play className="w-2.5 h-2.5" />
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="rounded-none h-5 w-5 p-0"
            onClick={handleView}
            title="Προβολή"
          >
            <Eye className="w-2.5 h-2.5" />
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="rounded-none h-5 w-5 p-0"
            onClick={handleEdit}
            title="Επεξεργασία"
          >
            <Edit className="w-2.5 h-2.5" />
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="rounded-none h-5 w-5 p-0"
            onClick={handleComplete}
            title="Ολοκλήρωση"
          >
            <CheckCircle2 className="w-2.5 h-2.5" />
          </Button>
        </div>
      </div>

      <DaySelector
        assignment={assignment}
        isOpen={daySelectorOpen}
        onClose={() => setDaySelectorOpen(false)}
        onSelectDay={handleDaySelected}
      />

      <DayProgramDialog
        isOpen={dayProgramDialogOpen}
        onClose={handleDialogClose}
        program={assignment}
        selectedDate={selectedDate}
        workoutStatus="not_started"
        onRefresh={onRefresh}
      />

      <AttendanceDialog
        assignment={assignment}
        isOpen={attendanceOpen}
        onClose={() => setAttendanceOpen(false)}
      />
    </>
  );
};
