
import React from 'react';
import { Button } from "@/components/ui/button";
import { Play, Eye, Edit, CheckCircle2 } from "lucide-react";

interface ProgramCardActionButtonsProps {
  onStart: () => void;
  onView: () => void;
  onEdit: () => void;
  onComplete: () => void;
}

export const ProgramCardActionButtons: React.FC<ProgramCardActionButtonsProps> = ({
  onStart,
  onView,
  onEdit,
  onComplete
}) => {
  return (
    <div className="flex items-center gap-0.5">
      <Button 
        size="sm" 
        variant="outline" 
        className="rounded-none h-5 w-5 p-0"
        onClick={onStart}
        title="Έναρξη"
      >
        <Play className="w-2.5 h-2.5" />
      </Button>
      <Button 
        size="sm" 
        variant="outline" 
        className="rounded-none h-5 w-5 p-0"
        onClick={onView}
        title="Προβολή"
      >
        <Eye className="w-2.5 h-2.5" />
      </Button>
      <Button 
        size="sm" 
        variant="outline" 
        className="rounded-none h-5 w-5 p-0"
        onClick={onEdit}
        title="Επεξεργασία"
      >
        <Edit className="w-2.5 h-2.5" />
      </Button>
      <Button 
        size="sm" 
        variant="outline" 
        className="rounded-none h-5 w-5 p-0"
        onClick={onComplete}
        title="Ολοκλήρωση"
      >
        <CheckCircle2 className="w-2.5 h-2.5" />
      </Button>
    </div>
  );
};
