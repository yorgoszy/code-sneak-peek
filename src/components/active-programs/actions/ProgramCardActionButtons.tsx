
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Play, Eye, Edit, CheckCircle, Trash2 } from "lucide-react";
import { ProgramViewDialog } from "@/components/active-programs/calendar/ProgramViewDialog";
import { DayProgramDialog } from "@/components/active-programs/calendar/DayProgramDialog";
import { useNavigate } from "react-router-dom";
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface ProgramCardActionButtonsProps {
  assignment: EnrichedAssignment;
  onRefresh?: () => void;
  selectedDate?: Date;
  onDelete?: (assignmentId: string) => void;
  userMode?: boolean;
}

export const ProgramCardActionButtons: React.FC<ProgramCardActionButtonsProps> = ({ 
  assignment, 
  onRefresh,
  selectedDate,
  onDelete,
  userMode = false
}) => {
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDayDialogOpen, setIsDayDialogOpen] = useState(false);
  const navigate = useNavigate();

  const handleStartWorkout = (weekIndex: number, dayIndex: number) => {
    console.log('🚀 Starting workout:', weekIndex, dayIndex);
    setIsViewDialogOpen(false);
    setIsDayDialogOpen(true);
  };

  const handleEdit = () => {
    navigate(`/dashboard/program-builder?edit=${assignment.program_id}`);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(assignment.id);
    }
  };

  return (
    <>
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 rounded-none"
          onClick={() => setIsViewDialogOpen(true)}
          title="Προβολή προγράμματος"
        >
          <Eye className="h-3 w-3" />
        </Button>

        {!userMode && (
          <>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 rounded-none"
              onClick={handleEdit}
              title="Επεξεργασία"
            >
              <Edit className="h-3 w-3" />
            </Button>

            {onDelete && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 rounded-none text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleDelete}
                title="Διαγραφή"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </>
        )}

        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 rounded-none text-[#00ffba] hover:text-[#00ffba]/80"
          onClick={() => setIsViewDialogOpen(true)}
          title="Έναρξη"
        >
          <Play className="h-3 w-3" />
        </Button>
      </div>

      <ProgramViewDialog
        isOpen={isViewDialogOpen}
        onClose={() => setIsViewDialogOpen(false)}
        assignment={assignment}
        onStartWorkout={handleStartWorkout}
      />

      <DayProgramDialog
        isOpen={isDayDialogOpen}
        onClose={() => setIsDayDialogOpen(false)}
        program={assignment}
        selectedDate={selectedDate || new Date()}
        workoutStatus="pending"
        onRefresh={onRefresh}
      />
    </>
  );
};
