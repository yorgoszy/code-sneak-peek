
import React from 'react';
import { ProgramBuilderDialog } from './ProgramBuilderDialog';
import { ProgramsList } from './ProgramsList';
import { ProgramBuilderTrigger } from './builder/ProgramBuilderTrigger';
import { Program, User, Exercise } from './types';

interface ProgramsLayoutProps {
  programs: Program[];
  selectedProgram: Program | null;
  users: User[];
  exercises: Exercise[];
  editingProgram: Program | null;
  builderDialogOpen: boolean;
  previewProgram: Program | null;
  previewDialogOpen: boolean;
  onSelectProgram: (program: Program) => void;
  onDeleteProgram: (programId: string) => void;
  onEditProgram: (program: Program) => void;
  onCreateProgram: (program: any) => Promise<any>;
  onBuilderDialogClose: () => void;
  onDuplicateProgram: (program: Program) => void;
  onPreviewProgram: (program: Program) => void;
  onPreviewDialogClose: () => void;
  onDeleteWeek: (weekId: string) => void;
  onDeleteDay: (dayId: string) => void;
  onDeleteBlock: (blockId: string) => void;
  onDeleteExercise: (exerciseId: string) => void;
  onOpenBuilder: () => void;
}

export const ProgramsLayout: React.FC<ProgramsLayoutProps> = ({
  programs,
  selectedProgram,
  users,
  exercises,
  editingProgram,
  builderDialogOpen,
  onSelectProgram,
  onDeleteProgram,
  onEditProgram,
  onCreateProgram,
  onBuilderDialogClose,
  onDuplicateProgram,
  onOpenBuilder
}) => {
  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">Προγράμματα Προπόνησης</h1>
        <ProgramBuilderTrigger onClick={onOpenBuilder} />
      </div>

      {/* Μόνο η λίστα προγραμμάτων - αφαιρέθηκε η προβολή λεπτομερειών */}
      <div className="w-full">
        <ProgramsList
          programs={programs}
          selectedProgram={selectedProgram}
          onSelectProgram={onSelectProgram}
          onDeleteProgram={onDeleteProgram}
          onEditProgram={onEditProgram}
          onDuplicateProgram={onDuplicateProgram}
        />
      </div>

      {builderDialogOpen && (
        <ProgramBuilderDialog
          users={users}
          exercises={exercises}
          onCreateProgram={onCreateProgram}
          editingProgram={editingProgram}
          isOpen={builderDialogOpen}
          onOpenChange={onBuilderDialogClose}
        />
      )}
    </div>
  );
};
