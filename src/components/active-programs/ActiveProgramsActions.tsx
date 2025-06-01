
import React from 'react';
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
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

    try {
      // Delete the assignment from program_assignments table
      const { error: deleteError } = await supabase
        .from('program_assignments')
        .delete()
        .eq('id', assignment.id);

      if (deleteError) {
        console.error('❌ Error deleting assignment:', deleteError);
        toast.error('Σφάλμα κατά τη διαγραφή της ανάθεσης');
        return;
      }

      console.log('✅ Assignment deleted successfully');
      toast.success('Η ανάθεση διαγράφηκε επιτυχώς - το πρόγραμμα επέστρεψε στα Πρόχειρα Προγράμματα');
      
      // Refresh current page data
      if (onRefresh) {
        onRefresh();
      }

      // Force refresh by dispatching a custom event that other pages can listen to
      window.dispatchEvent(new CustomEvent('programAssignmentChanged'));
      
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
