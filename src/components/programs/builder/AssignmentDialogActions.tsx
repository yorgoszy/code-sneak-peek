
import React from 'react';
import { Button } from "@/components/ui/button";

interface AssignmentDialogActionsProps {
  onClose: () => void;
  onAssign: () => void;
  canAssign: boolean;
  editMode?: boolean;
  isReassignment?: boolean;
}

export const AssignmentDialogActions: React.FC<AssignmentDialogActionsProps> = ({
  onClose,
  onAssign,
  canAssign,
  editMode = false,
  isReassignment = false
}) => {
  const getButtonText = () => {
    if (editMode) {
      return isReassignment ? 'Επανα-ανάθεση Προγράμματος' : 'Ενημέρωση Ανάθεσης';
    }
    return 'Ανάθεση Προγράμματος';
  };

  return (
    <div className="flex justify-end gap-2 p-6 border-t">
      <Button
        variant="outline"
        onClick={onClose}
        className="rounded-none"
      >
        Ακύρωση
      </Button>
      <Button
        onClick={onAssign}
        disabled={!canAssign}
        className="rounded-none"
        style={{ backgroundColor: canAssign ? '#00ffba' : undefined }}
      >
        {getButtonText()}
      </Button>
    </div>
  );
};
