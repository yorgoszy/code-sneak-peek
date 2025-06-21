
import React from 'react';
import { Button } from "@/components/ui/button";
import { Save, Users } from "lucide-react";
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
  const isValidProgram = program.name && program.weeks && program.weeks.length > 0;
  const hasTrainingDates = program.training_dates && program.training_dates.length > 0;

  return (
    <div className="flex-shrink-0 border-t bg-white p-3 md:p-6">
      <div className="flex flex-col md:flex-row gap-2 md:gap-4 justify-end">
        <Button
          onClick={onSave}
          disabled={!isValidProgram}
          className="rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black order-2 md:order-1"
        >
          <Save className="w-4 h-4 mr-2" />
          {program.id ? 'Ενημέρωση' : 'Αποθήκευση'}
        </Button>
        
        <Button
          onClick={onAssignment}
          disabled={!isValidProgram}
          variant="outline"
          className="rounded-none order-1 md:order-2"
        >
          <Users className="w-4 h-4 mr-2" />
          Αναθέσεις
        </Button>
      </div>
      
      {totalDays > 0 && (
        <div className="mt-2 text-xs text-gray-600 text-center md:text-right">
          Συνολικές ημέρες προπόνησης: {totalDays}
          {hasTrainingDates && (
            <span className="text-[#00ffba] ml-1">
              ✓ Επιλεγμένες: {program.training_dates.length}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
