
import React from 'react';
import { Button } from "@/components/ui/button";
import { Check, Calendar } from "lucide-react";
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
  const hasRequiredData = program.name && program.weeks && program.weeks.length > 0;
  const hasTrainingDates = program.training_dates && program.training_dates.length >= totalDays;
  const hasSelectedUser = program.user_id;
  
  const canAssign = hasRequiredData && hasTrainingDates && hasSelectedUser && totalDays > 0;

  console.log('ActionButtons state:', {
    hasRequiredData,
    hasTrainingDates,
    hasSelectedUser,
    totalDays,
    canAssign,
    programName: program.name,
    weeksCount: program.weeks?.length,
    datesCount: program.training_dates?.length,
    userId: program.user_id
  });

  return (
    <div className="flex-shrink-0 p-6 border-t bg-white">
      <div className="flex justify-end gap-3">
        <Button
          onClick={onSave}
          variant="outline"
          className="rounded-none"
          disabled={!program.name}
        >
          <Check className="w-4 h-4 mr-2" />
          Αποθήκευση Προγράμματος
        </Button>
        
        <Button
          onClick={onAssignment}
          disabled={!canAssign}
          className="rounded-none"
          style={{ 
            backgroundColor: canAssign ? '#00ffba' : undefined,
            color: canAssign ? 'black' : undefined
          }}
        >
          <Calendar className="w-4 h-4 mr-2" />
          Ανάθεση Προγράμματος
        </Button>
      </div>
      
      {!canAssign && (
        <div className="mt-2 text-sm text-red-600">
          {!hasRequiredData && "Συμπληρώστε όνομα και δημιουργήστε εβδομάδες"}
          {hasRequiredData && !hasSelectedUser && "Επιλέξτε αθλητή"}
          {hasRequiredData && hasSelectedUser && !hasTrainingDates && 
            `Επιλέξτε ${totalDays} ημερομηνίες προπόνησης`
          }
        </div>
      )}
    </div>
  );
};
