
import React from 'react';
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface ProgramViewerHeaderProps {
  assignment: EnrichedAssignment;
  mode: 'view' | 'start';
}

export const ProgramViewerHeader: React.FC<ProgramViewerHeaderProps> = ({ 
  assignment, 
  mode 
}) => {
  const title = mode === 'start' 
    ? `Έναρξη Προπονήσης - ${assignment.programs?.name}`
    : `Προβολή Προγράμματος - ${assignment.programs?.name}`;

  return (
    <DialogHeader>
      <DialogTitle className="flex items-center justify-between">
        <span>{title}</span>
        <Badge variant="outline" className="rounded-none">
          {assignment.status}
        </Badge>
      </DialogTitle>
      {assignment.programs?.description && (
        <p className="text-sm text-gray-600">{assignment.programs.description}</p>
      )}
    </DialogHeader>
  );
};
