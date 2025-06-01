
import React from 'react';
import { Program } from './types';
import { ProgramCard } from './list/ProgramCard';

interface ProgramsListProps {
  programs: Program[];
  selectedProgram: Program | null;
  onSelectProgram: (program: Program) => void;
  onDeleteProgram: (programId: string) => void;
  onEditProgram: (program: Program) => void;
  onDuplicateProgram?: (program: Program) => void;
  onPreviewProgram?: (program: Program) => void;
}

export const ProgramsList: React.FC<ProgramsListProps> = ({
  programs,
  selectedProgram,
  onSelectProgram,
  onDeleteProgram,
  onEditProgram,
  onDuplicateProgram,
  onPreviewProgram
}) => {
  if (programs.length === 0) {
    return (
      <div className="w-full">
        <h2 className="text-xl font-semibold mb-4">Προγράμματα</h2>
        <div className="text-center py-8 text-gray-500">
          Δεν υπάρχουν προγράμματα ακόμα
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold mb-4">Προγράμματα</h2>
      <div className="space-y-3">
        {programs.map(program => (
          <ProgramCard
            key={program.id}
            program={program}
            selectedProgram={selectedProgram}
            onSelectProgram={onSelectProgram}
            onDeleteProgram={onDeleteProgram}
            onEditProgram={onEditProgram}
            onDuplicateProgram={onDuplicateProgram}
            onPreviewProgram={onPreviewProgram}
          />
        ))}
      </div>
    </div>
  );
};
