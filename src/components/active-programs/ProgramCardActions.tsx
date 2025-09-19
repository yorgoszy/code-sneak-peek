
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Eye, Edit, CheckCircle, Trash2 } from "lucide-react";
import { ProgramViewDialog } from "./calendar/ProgramViewDialog";
import { DayProgramDialog } from "./calendar/DayProgramDialog";
import { format } from "date-fns";
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface ProgramCardActionsProps {
  assignment: EnrichedAssignment;
  selectedDate?: Date;
  onRefresh?: () => void;
  onDelete?: (assignmentId: string) => void;
  userMode?: boolean;
  workoutStats?: {
    completed: number;
    total: number;
    missed: number;
  };
}

export const ProgramCardActions: React.FC<ProgramCardActionsProps> = ({
  assignment,
  selectedDate,
  onRefresh,
  onDelete,
  userMode = false,
  workoutStats
}) => {
  const [isProgramViewOpen, setIsProgramViewOpen] = useState(false);
  const [isDayProgramOpen, setIsDayProgramOpen] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-[#00ffba] text-black';
      case 'completed':
        return 'bg-gray-500 text-white';
      case 'paused':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const handleStartWorkout = (weekIndex: number, dayIndex: number) => {
    setIsDayProgramOpen(true);
  };

  const handleDeleteClick = () => {
    if (onDelete) {
      onDelete(assignment.id);
    }
  };

  // Calculate workout status for selected date
  const workoutStatus = selectedDate ? (() => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    // This would need to be implemented based on your workout completion logic
    return 'pending'; // or 'completed', 'missed', etc.
  })() : 'pending';

  return (
    <>
      <div className="flex items-center gap-1 flex-shrink-0">
        <div className="flex gap-0.5">
          {!userMode && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-gray-100"
              onClick={() => setIsProgramViewOpen(true)}
              title="Επεξεργασία Προγράμματος"
            >
              <Edit className="h-3 w-3" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-gray-100"
            onClick={() => {
              console.log('👁️ Opening ProgramViewDialog with assignment:', assignment);
              console.log('👁️ Assignment programs:', assignment?.programs);
              console.log('👁️ Program weeks:', assignment?.programs?.program_weeks);
              setIsProgramViewOpen(true);
            }}
            title="Προβολή Προγράμματος"
          >
            <Eye className="h-3 w-3" />
          </Button>

          {selectedDate && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-blue-100"
              onClick={() => setIsDayProgramOpen(true)}
              title="Έναρξη Προπόνησης"
            >
              <Play className="h-3 w-3 text-blue-600" />
            </Button>
          )}

          {!userMode && onDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-red-100"
              onClick={handleDeleteClick}
              title="Διαγραφή"
            >
              <Trash2 className="h-3 w-3 text-red-600" />
            </Button>
          )}
        </div>
      </div>

      <ProgramViewDialog
        isOpen={isProgramViewOpen}
        onClose={() => {
          console.log('🔄 Closing ProgramViewDialog');
          setIsProgramViewOpen(false);
        }}
        assignment={assignment}
        onStartWorkout={handleStartWorkout}
        editMode={!userMode}
        onRefresh={onRefresh}
      />

      {selectedDate && (
        <DayProgramDialog
          isOpen={isDayProgramOpen}
          onClose={() => setIsDayProgramOpen(false)}
          program={assignment}
          selectedDate={selectedDate}
          workoutStatus={workoutStatus}
          onRefresh={onRefresh}
        />
      )}
    </>
  );
};
