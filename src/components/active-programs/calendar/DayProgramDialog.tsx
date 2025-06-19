
import React from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { DayProgramDialogContent } from './DayProgramDialogContent';
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface DayProgramDialogProps {
  isOpen: boolean;
  onClose: () => void;
  program: EnrichedAssignment | null;
  selectedDate: Date | null;
  workoutStatus: string;
  onRefresh?: () => void;
  onMinimize?: () => void;
}

export const DayProgramDialog: React.FC<DayProgramDialogProps> = ({
  isOpen,
  onClose,
  program,
  selectedDate,
  workoutStatus,
  onRefresh,
  onMinimize
}) => {
  if (!program || !selectedDate) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto rounded-none w-[95vw] md:w-full">
        <DayProgramDialogContent
          program={program}
          selectedDate={selectedDate}
          workoutStatus={workoutStatus}
          onRefresh={onRefresh}
          onMinimize={onMinimize}
        />
      </DialogContent>
    </Dialog>
  );
};
