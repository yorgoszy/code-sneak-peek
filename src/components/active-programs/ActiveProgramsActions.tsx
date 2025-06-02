
import React from 'react';
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface ActiveProgramsActionsProps {
  assignment: EnrichedAssignment;
  onRefresh?: () => void;
}

export const ActiveProgramsActions: React.FC<ActiveProgramsActionsProps> = ({ 
  assignment, 
  onRefresh 
}) => {
  const navigate = useNavigate();

  const handleDeleteProgram = () => {
    // Navigate to programs page where user can delete the actual program
    navigate('/dashboard/programs');
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleDeleteProgram}
        className="rounded-none hover:bg-red-50 hover:border-red-300"
      >
        <Trash2 className="w-4 h-4 mr-2" />
        Διαγραφή Προγράμματος
      </Button>
    </div>
  );
};
