
import React from 'react';
import { format } from "date-fns";
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface ProgramSelectionDialogProps {
  isOpen: boolean;
  programs: EnrichedAssignment[];
  date: Date;
  allCompletions: any[];
  onClose: () => void;
  onProgramSelect: (program: EnrichedAssignment) => void;
}

export const ProgramSelectionDialog: React.FC<ProgramSelectionDialogProps> = ({
  isOpen,
  programs,
  date,
  allCompletions,
  onClose,
  onProgramSelect
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-gray-900 z-10 p-4">
      <div className="mb-4">
        <h3 className="text-white text-sm font-medium mb-2">
          Επιλέξτε πρόγραμμα για {format(date, 'dd/MM/yyyy')}
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white text-xs"
        >
          ← Πίσω
        </button>
      </div>
      <div className="space-y-2">
        {programs.map((program) => {
          const dayString = format(date, 'yyyy-MM-dd');
          const completion = allCompletions.find(c => 
            c.assignment_id === program.id && 
            c.scheduled_date === dayString
          );
          return (
            <div
              key={program.id}
              className="bg-gray-800 p-3 cursor-pointer hover:bg-gray-700 transition-colors"
              onClick={() => onProgramSelect(program)}
            >
              <div className="flex items-center justify-between">
                <span className="text-white text-sm">{program.programs?.name}</span>
                <span className={`text-xs px-2 py-1 ${completion ? 'bg-green-600 text-white' : 'bg-orange-600 text-white'}`}>
                  {completion ? 'Ολοκληρωμένο' : 'Προγραμματισμένο'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
