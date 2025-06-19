
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { usePrograms } from "@/hooks/usePrograms";
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface ActiveProgramsActionsProps {
  assignment: EnrichedAssignment;
  onRefresh?: () => void;
}

export const ActiveProgramsActions: React.FC<ActiveProgramsActionsProps> = ({ 
  assignment, 
  onRefresh 
}) => {
  const { deleteProgram } = usePrograms();
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const handleDeleteProgram = async () => {
    try {
      const success = await deleteProgram(assignment.program_id);
      if (success && onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error deleting program:', error);
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setConfirmDialogOpen(true)}
          className="rounded-none hover:bg-red-50 hover:border-red-300"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Διαγραφή Προγράμματος
        </Button>
      </div>

      <ConfirmationDialog
        isOpen={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={handleDeleteProgram}
        description="Είστε σίγουροι ότι θέλετε να διαγράψετε αυτό το πρόγραμμα;"
      />
    </>
  );
};
