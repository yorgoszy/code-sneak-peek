
import React from 'react';
import { DialogFooter } from "@/components/ui/dialog";
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
  const isValid = program.name.trim().length > 0 && program.weeks.length > 0;

  return (
    <DialogFooter className="flex-shrink-0 p-4 md:p-6 border-t bg-gray-50">
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full">
        {/* Program Info - Mobile friendly */}
        <div className="flex-1 text-center sm:text-left">
          <p className="text-xs sm:text-sm text-gray-600">
            {program.weeks.length} εβδομάδ{program.weeks.length !== 1 ? 'ες' : 'α'} • {totalDays} ημέρ{totalDays !== 1 ? 'ες' : 'α'}
          </p>
          {program.training_dates && program.training_dates.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              {program.training_dates.length} προπονήσ{program.training_dates.length !== 1 ? 'εις' : 'η'} προγραμματισμέν{program.training_dates.length !== 1 ? 'ες' : 'η'}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button
            onClick={onAssignment}
            variant="outline"
            className="rounded-none w-full sm:w-auto order-2 sm:order-1"
            disabled={!isValid}
          >
            <Users className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Αναθέσεις</span>
            <span className="sm:hidden">Assign</span>
          </Button>

          <Button
            onClick={onSave}
            className="rounded-none w-full sm:w-auto order-1 sm:order-2"
            disabled={!isValid}
          >
            <Save className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">
              {program.id ? 'Ενημέρωση' : 'Αποθήκευση'}
            </span>
            <span className="sm:hidden">
              {program.id ? 'Update' : 'Save'}
            </span>
          </Button>
        </div>
      </div>
    </DialogFooter>
  );
};
