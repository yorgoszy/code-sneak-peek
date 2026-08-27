
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Eye, Edit, CheckCircle, Trash2, CheckCircle2 } from "lucide-react";
import { ProgramViewDialog } from "./calendar/ProgramViewDialog";
import { DayProgramDialog } from "./calendar/DayProgramDialog";
import { format } from "date-fns";
import { fetchFullProgram } from "@/utils/programsFetch";
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface ProgramCardActionsProps {
  assignment: EnrichedAssignment;
  selectedDate?: Date;
  onRefresh?: () => void;
  onDelete?: (assignmentId: string) => void;
  onForceComplete?: (assignmentId: string) => void;
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
  onForceComplete,
  userMode = false,
  workoutStats
}) => {
  const { t } = useTranslation();
  const [isProgramViewOpen, setIsProgramViewOpen] = useState(false);
  const [isDayProgramOpen, setIsDayProgramOpen] = useState(false);
  const [fullAssignment, setFullAssignment] = useState<EnrichedAssignment>(assignment);
  const [loadingProgram, setLoadingProgram] = useState(false);

  // ⚡ Lazy load: όταν η λίστα φορτώνεται σε light mode, φέρνουμε το πλήρες
  // πρόγραμμα μόνο όταν ο χρήστης ανοίγει τον διάλογο.
  const ensureFullProgram = async () => {
    if (fullAssignment.programs?.program_weeks?.length) return;
    if (!assignment.program_id) return;
    setLoadingProgram(true);
    try {
      const full = await fetchFullProgram(assignment.program_id);
      if (full) {
        setFullAssignment({ ...assignment, programs: full as any });
      }
    } finally {
      setLoadingProgram(false);
    }
  };

  React.useEffect(() => {
    setFullAssignment(prev =>
      prev.programs?.program_weeks?.length && prev.id === assignment.id
        ? { ...prev, ...assignment, programs: prev.programs }
        : assignment
    );
  }, [assignment]);

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
    ensureFullProgram();
    setIsDayProgramOpen(true);
  };

  const handleDeleteClick = () => {
    if (onDelete) {
      onDelete(assignment.id);
    }
  };

  const handleForceCompleteClick = () => {
    if (onForceComplete) {
      onForceComplete(assignment.id);
    }
  };

  // Calculate workout status for selected date
  const workoutStatus = selectedDate ? (() => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    // This would need to be implemented based on your workout completion logic
    return 'pending'; // or 'completed', 'missed', etc.
  })() : 'pending';

  // Only show force complete button for active programs
  const showForceComplete = !userMode && onForceComplete && assignment.status === 'active';

  return (
    <>
      <div className="flex items-center gap-1 flex-shrink-0">
        <div className="flex gap-0.5">
          {/* Edit button hidden - exists in ProgramViewDialog */}

          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-gray-100"
            onClick={() => {
              console.log('👁️ Opening ProgramViewDialog with assignment:', assignment);
              console.log('👁️ Assignment programs:', assignment?.programs);
              console.log('👁️ Program weeks:', assignment?.programs?.program_weeks);
              ensureFullProgram();
              setIsProgramViewOpen(true);
            }}
            title={t('programs.viewProgram')}
          >
            <Eye className="h-3 w-3" />
          </Button>

          {selectedDate && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-blue-100"
              onClick={() => { ensureFullProgram(); setIsDayProgramOpen(true); }}
              title={t('programs.startWorkout')}
            >
              <Play className="h-3 w-3 text-blue-600" />
            </Button>
          )}

          {showForceComplete && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-[#00ffba]/20"
              onClick={handleForceCompleteClick}
              title="Ολοκλήρωση Προγράμματος"
            >
              <CheckCircle2 className="h-3 w-3 text-[#00ffba]" />
            </Button>
          )}

          {!userMode && onDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-red-100"
              onClick={handleDeleteClick}
              title={t('programs.delete')}
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
        assignment={fullAssignment}
        onStartWorkout={handleStartWorkout}
        editMode={!userMode}
        onRefresh={onRefresh}
      />

      {selectedDate && (
        <DayProgramDialog
          isOpen={isDayProgramOpen}
          onClose={() => setIsDayProgramOpen(false)}
          program={fullAssignment}
          selectedDate={selectedDate}
          workoutStatus={workoutStatus}
          onRefresh={onRefresh}
        />
      )}
    </>
  );
};
