
import React from 'react';
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface ActiveProgramsActionsProps {
  assignment: EnrichedAssignment;
  onRefresh?: () => void;
  onDeleteProgram?: (assignmentId: string) => Promise<boolean>;
}

export const ActiveProgramsActions: React.FC<ActiveProgramsActionsProps> = ({ 
  assignment, 
  onRefresh,
  onDeleteProgram
}) => {
  const handleDeleteAssignment = async () => {
    if (!confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την ανάθεση;')) {
      return;
    }

    console.log('🗑️ Attempting to delete assignment:', assignment.id);
    console.log('🗑️ Assignment object:', assignment);

    try {
      let success = false;
      
      if (onDeleteProgram) {
        // Use the parent's delete function if provided
        success = await onDeleteProgram(assignment.id);
      }
      
      if (success && onRefresh) {
        console.log('✅ Assignment deleted successfully, refreshing list');
        onRefresh();
      } else if (!success) {
        toast.error('Σφάλμα κατά τη διαγραφή της ανάθεσης');
      }
    } catch (error) {
      console.error('❌ Error in handleDeleteAssignment:', error);
      toast.error('Σφάλμα κατά τη διαγραφή της ανάθεσης');
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
