
import React from 'react';
import { Button } from "@/components/ui/button";
import { Save, CalendarCheck } from "lucide-react";
import type { ProgramStructure } from './hooks/useProgramBuilderState';

interface ActionButtonsProps {
  program: ProgramStructure;
  totalDays: number;
  onSave: () => void;
  onAssignment: () => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  program,
  totalDays,
  onSave,
  onAssignment
}) => {
  const selectedDatesCount = program.training_dates?.length || 0;
  const hasRequiredDates = selectedDatesCount >= totalDays;

  return (
    <div className="flex justify-end gap-2 p-6 border-t flex-shrink-0">
      <Button
        onClick={onSave}
        variant="outline"
        className="rounded-none"
      >
        <Save className="w-4 h-4 mr-2" />
        Αποθήκευση ως Προσχέδιο
      </Button>
      
      <Button
        onClick={onAssignment}
        className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
        disabled={!program.name || !program.user_id || totalDays === 0 || !hasRequiredDates}
      >
        <CalendarCheck className="w-4 h-4 mr-2" />
        Ανάθεση
      </Button>
    </div>
  );
};
