
import React from 'react';
import { EditableProgramViewDialog } from './EditableProgramViewDialog';
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface ProgramViewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: EnrichedAssignment | null;
  onStartWorkout?: (weekIndex: number, dayIndex: number) => void;
  editMode?: boolean;
  onRefresh?: () => void;
}

export const ProgramViewDialog: React.FC<ProgramViewDialogProps> = (props) => {
  return <EditableProgramViewDialog {...props} />;
};
