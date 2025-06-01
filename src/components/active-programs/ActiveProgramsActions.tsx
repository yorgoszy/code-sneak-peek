
import React from 'react';
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useProgramAssignments } from "@/hooks/programs/useProgramAssignments";
import { toast } from "sonner";
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface ActiveProgramsActionsProps {
  assignment: EnrichedAssignment;
  onRefresh?: () => void;
}

export const ActiveProgramsActions: React.FC<ActiveProgramsActionsProps> = ({ 
  assignment, 
  onRefresh 
}) => {
  const { deleteAssignment } = useProgramAssignments();

  const handleDeleteAssignment = async () => {
    if (!confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την ανάθεση;')) {
      return;
    }

    try {
      const success = await deleteAssignment(assignment.id);
      if (success && onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error deleting assignment:', error);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleDeleteAssignment}
        className="rounded-none hover:bg-red-50 hover:border-red-300"
      >
        <Trash2 className="w-4 h-4 mr-2" />
        Διαγραφή Ανάθεσης
      </Button>
    </div>
  );
};
