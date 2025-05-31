
import React from 'react';
import { ProgramBuilderDialog } from './ProgramBuilderDialog';
import { ProgramsList } from './ProgramsList';
import { ProgramDetails } from './ProgramDetails';
import { ProgramPreviewDialog } from './ProgramPreviewDialog';
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
  onCreateProgram: (program: any) => void;
  onBuilderDialogClose: (open: boolean) => void;
  onDuplicateProgram: (program: Program) => void;
  onPreviewProgram: (program: Program) => void;
  onPreviewDialogClose: (open: boolean) => void;
  onDeleteWeek: (weekId: string) => void;
  onDeleteDay: (dayId: string) => void;
  onDeleteBlock: (blockId: string) => void;
  onDeleteExercise: (exerciseId: string) => void;
}

export const ProgramsLayout: React.FC<ProgramsLayoutProps> = ({
  programs,
  selectedProgram,
  users,
  exercises,
  editingProgram,
  builderDialogOpen,
  previewProgram,
  previewDialogOpen,
  onSelectProgram,
  onDeleteProgram,
  onEditProgram,
  onCreateProgram,
  onBuilderDialogClose,
  onDuplicateProgram,
  onPreviewProgram,
  onPreviewDialogClose,
  onDeleteWeek,
  onDeleteDay,
  onDeleteBlock,
  onDeleteExercise
}) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Προγράμματα Προπόνησης</h1>
        <ProgramBuilderDialog
          users={users}
          exercises={exercises}
          onCreateProgram={onCreateProgram}
          editingProgram={editingProgram}
          isOpen={builderDialogOpen}
          onOpenChange={onBuilderDialogClose}
          showTrigger={false}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Programs List - Now takes 2 columns */}
        <div className="lg:col-span-2">
          <ProgramsList
            programs={programs}
            selectedProgram={selectedProgram}
            onSelectProgram={onSelectProgram}
            onDeleteProgram={onDeleteProgram}
            onEditProgram={onEditProgram}
            onDuplicateProgram={onDuplicateProgram}
            onPreviewProgram={onPreviewProgram}
          />
        </div>

        {/* Program Details - Now takes 1 column */}
        <div className="lg:col-span-1">
          <ProgramDetails
            selectedProgram={selectedProgram}
            users={users}
            exercises={exercises}
            onDeleteWeek={onDeleteWeek}
            onDeleteDay={onDeleteDay}
            onDeleteBlock={onDeleteBlock}
            onDeleteExercise={onDeleteExercise}
            onEditProgram={onEditProgram}
          />
        </div>
      </div>

      {/* Preview Dialog */}
      <ProgramPreviewDialog
        program={previewProgram}
        isOpen={previewDialogOpen}
        onOpenChange={onPreviewDialogClose}
      />
    </div>
  );
};
