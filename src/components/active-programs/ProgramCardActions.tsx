
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { ProgramCardActionButtons } from './actions/ProgramCardActionButtons';
import { ProgramCardStatusBadge } from './actions/ProgramCardStatusBadge';
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface ProgramCardActionsProps {
  assignment: EnrichedAssignment;
  onRefresh?: () => void;
  selectedDate?: Date;
  onDelete?: (assignmentId: string) => void;
  userMode?: boolean;
}

export const ProgramCardActions: React.FC<ProgramCardActionsProps> = ({ 
  assignment, 
  onRefresh,
  selectedDate,
  onDelete,
  userMode = false
}) => {
  return (
    <div className="flex items-center gap-1 flex-shrink-0">
      <ProgramCardStatusBadge status={assignment.status} />
      <ProgramCardActionButtons 
        assignment={assignment} 
        onRefresh={onRefresh}
        selectedDate={selectedDate}
        onDelete={onDelete}
        userMode={userMode}
      />
    </div>
  );
};
