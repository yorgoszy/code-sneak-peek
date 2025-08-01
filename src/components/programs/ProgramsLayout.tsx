
import React from 'react';
import { ProgramBuilderDialog } from './ProgramBuilderDialog';
import { ProgramsList } from './ProgramsList';
import { ProgramBuilderTrigger } from './builder/ProgramBuilderTrigger';
import { Program, User, Exercise } from './types';
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();

  return (
    <div className={`${isMobile ? 'space-y-4' : 'space-y-6'}`}>
      <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'justify-between items-center'}`}>
        <h1 className={`${isMobile ? 'text-xl' : 'text-2xl lg:text-3xl'} font-bold`}>
          {isMobile ? 'Προγράμματα' : 'Προγράμματα Προπόνησης'}
        </h1>
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
