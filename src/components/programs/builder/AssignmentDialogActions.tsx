
import React from 'react';
import { Button } from "@/components/ui/button";
import { Users, User } from "lucide-react";

interface AssignmentDialogActionsProps {
  onClose: () => void;
  onAssign: () => void;
  canAssign: boolean;
  editMode: boolean;
  isReassignment: boolean;
  assignmentType?: 'individual' | 'group';
  targetName?: string;
}

export const AssignmentDialogActions: React.FC<AssignmentDialogActionsProps> = ({
  onClose,
  onAssign,
  canAssign,
  editMode,
  isReassignment,
  assignmentType = 'individual',
  targetName
}) => {
  const getButtonText = () => {
    if (editMode) {
      return isReassignment ? 'Επαναανάθεση' : 'Ενημέρωση';
    }
    
    if (assignmentType === 'group') {
      return 'Ανάθεση σε Ομάδα';
    }
    
    return 'Ανάθεση';
  };

  const getButtonIcon = () => {
    return assignmentType === 'group' ? <Users className="w-4 h-4 mr-2" /> : <User className="w-4 h-4 mr-2" />;
  };

  return (
    <div className="flex-shrink-0 flex justify-between items-center p-6 border-t bg-white">
      <Button
        variant="outline"
        onClick={onClose}
        className="rounded-none"
      >
        Ακύρωση
      </Button>
      
      <div className="flex items-center gap-3">
        {targetName && (
          <div className="text-sm text-gray-600">
            {assignmentType === 'individual' ? 'Αθλητής:' : 'Ομάδα:'} <span className="font-medium">{targetName}</span>
          </div>
        )}
        
        <Button
          onClick={onAssign}
          disabled={!canAssign}
          className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
        >
          {getButtonIcon()}
          {getButtonText()}
        </Button>
      </div>
    </div>
  );
};
