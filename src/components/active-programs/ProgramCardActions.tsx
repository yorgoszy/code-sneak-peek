
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Eye, Edit, CheckCircle, Trash2 } from "lucide-react";
import { ProgramViewDialog } from "./calendar/ProgramViewDialog";
import { DayProgramDialog } from "./calendar/DayProgramDialog";
import { DaySelector } from "./calendar/DaySelector";
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface ProgramCardActionsProps {
  assignment: EnrichedAssignment;
  selectedDate?: Date;
  onRefresh?: () => void;
  onDelete?: (assignmentId: string) => void;
  userMode?: boolean;
}

export const ProgramCardActions: React.FC<ProgramCardActionsProps> = ({ 
  assignment, 
  selectedDate,
  onRefresh,
  onDelete,
  userMode = false
}) => {
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [dayDialogOpen, setDayDialogOpen] = useState(false);
  const [daySelectorOpen, setDaySelectorOpen] = useState(false);
  const [selectedWorkoutDate, setSelectedWorkoutDate] = useState<Date | null>(null);

  const handlePlayClick = () => {
    if (selectedDate) {
      setSelectedWorkoutDate(selectedDate);
      setDayDialogOpen(true);
    } else {
      setDaySelectorOpen(true);
    }
  };

  const handleStartWorkout = (weekIndex: number, dayIndex: number) => {
    console.log('🚀 Starting workout from ProgramViewDialog:', weekIndex, dayIndex);
    
    // Υπολογίζουμε την ημερομηνία από τα training_dates
    if (assignment.training_dates && assignment.programs?.program_weeks?.[0]?.program_days) {
      const daysPerWeek = assignment.programs.program_weeks[0].program_days.length;
      const totalDayIndex = (weekIndex * daysPerWeek) + dayIndex;
      
      if (totalDayIndex < assignment.training_dates.length) {
        const dateStr = assignment.training_dates[totalDayIndex];
        setSelectedWorkoutDate(new Date(dateStr));
        setDayDialogOpen(true);
      }
    }
  };

  const handleDaySelected = (weekIndex: number, dayIndex: number) => {
    setDaySelectorOpen(false);
    handleStartWorkout(weekIndex, dayIndex);
  };

  const handleDeleteClick = () => {
    if (onDelete) {
      onDelete(assignment.id);
    }
  };

  return (
    <>
      <div className="flex items-center gap-1 flex-shrink-0">
        {/* Status Badge */}
        <Badge 
          variant="outline" 
          className="rounded-none bg-[#00ffba]/10 text-[#00ffba] border-[#00ffba] text-xs px-1 py-0"
        >
          Active
        </Badge>

        {/* Action Buttons */}
        <div className="flex items-center">
          {/* Εμφάνιση Play button μόνο αν δεν είμαστε σε user mode */}
          {!userMode && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePlayClick}
              className="h-6 w-6 p-0 rounded-none"
              title="Έναρξη Προπόνησης"
            >
              <Play className="h-3 w-3" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewDialogOpen(true)}
            className="h-6 w-6 p-0 rounded-none"
            title="Προβολή Προγράμματος"
          >
            <Eye className="h-3 w-3" />
          </Button>

          {/* Εμφάνιση των υπόλοιπων εικονιδίων μόνο αν δεν είμαστε σε user mode */}
          {!userMode && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => console.log('Edit clicked')}
                className="h-6 w-6 p-0 rounded-none"
                title="Επεξεργασία"
              >
                <Edit className="h-3 w-3" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => console.log('Complete clicked')}
                className="h-6 w-6 p-0 rounded-none"
                title="Ολοκλήρωση"
              >
                <CheckCircle className="h-3 w-3" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteClick}
                className="h-6 w-6 p-0 rounded-none text-red-600 hover:text-red-700"
                title="Διαγραφή"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <ProgramViewDialog
        isOpen={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        assignment={assignment}
        onStartWorkout={handleStartWorkout}
      />

      <DayProgramDialog
        isOpen={dayDialogOpen}
        onClose={() => setDayDialogOpen(false)}
        program={assignment}
        selectedDate={selectedWorkoutDate}
        workoutStatus="scheduled"
        onRefresh={onRefresh}
      />

      <DaySelector
        assignment={assignment}
        isOpen={daySelectorOpen}
        onClose={() => setDaySelectorOpen(false)}
        onSelectDay={handleDaySelected}
      />
    </>
  );
};
