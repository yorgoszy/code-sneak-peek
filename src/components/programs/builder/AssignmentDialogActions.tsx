
import React from 'react';
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";

interface AssignmentDialogActionsProps {
  onClose: () => void;
  onAssign: () => void;
  canAssign: boolean;
}

export const AssignmentDialogActions: React.FC<AssignmentDialogActionsProps> = ({
  onClose,
  onAssign,
  canAssign
}) => {
  return (
    <div className="flex justify-end gap-2 pt-4 border-t flex-shrink-0">
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
      >
        <CalendarIcon className="w-4 h-4 mr-2" />
        Ανάθεση Προγράμματος
      </Button>
    </div>
  );
};
