import React from 'react';
import { ProgramBuilderDialog } from './ProgramBuilderDialog';
import { ProgramsList } from './ProgramsList';
import { ProgramDetails } from './ProgramDetails';
import { Program, User, Exercise, Week, Day, Block } from './types';

interface ProgramsLayoutProps {
  programs: Program[];
  selectedProgram: Program | null;
  users: User[];
  exercises: Exercise[];
  editingProgram: Program | null;
  builderDialogOpen: boolean;
  onSelectProgram: (program: Program) => void;
  onDeleteProgram: (programId: string) => void;
  onEditProgram: (program: Program) => void;
  onCreateProgram: (program: any) => void;
  onBuilderDialogClose: (open: boolean) => void;
  showNewWeek: boolean;
  setShowNewWeek: (show: boolean) => void;
  newWeek: { name: string; week_number: number };
  setNewWeek: (week: { name: string; week_number: number }) => void;
  onDeleteWeek: (weekId: string) => void;
  onDeleteDay: (dayId: string) => void;
  onDeleteBlock: (blockId: string) => void;
  onDeleteExercise: (exerciseId: string) => void;
  onSetCurrentWeek: (week: Week) => void;
  onSetCurrentDay: (day: Day) => void;
  onSetCurrentBlock: (block: Block) => void;
  showNewDay: boolean;
  setShowNewDay: (show: boolean) => void;
  newDay: { name: string; day_number: number };
  setNewDay: (day: { name: string; day_number: number }) => void;
  showNewBlock: boolean;
  setShowNewBlock: (show: boolean) => void;
  newBlock: { name: string; block_order: number };
  setNewBlock: (block: { name: string; block_order: number }) => void;
  showNewExercise: boolean;
  setShowNewExercise: (show: boolean) => void;
  newExercise: any;
  setNewExercise: (exercise: any) => void;
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
  showNewWeek,
  setShowNewWeek,
  newWeek,
  setNewWeek,
  onDeleteWeek,
  onDeleteDay,
  onDeleteBlock,
  onDeleteExercise,
  onSetCurrentWeek,
  onSetCurrentDay,
  onSetCurrentBlock,
  showNewDay,
  setShowNewDay,
  newDay,
  setNewDay,
  showNewBlock,
  setShowNewBlock,
  newBlock,
  setNewBlock,
  showNewExercise,
  setShowNewExercise,
  newExercise,
  setNewExercise
}) => {
  const handleOpenBuilder = () => {
    onBuilderDialogClose(true);
  };

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
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Programs List */}
        <div className="lg:col-span-1">
          <ProgramsList
            programs={programs}
            selectedProgram={selectedProgram}
            onSelectProgram={onSelectProgram}
            onDeleteProgram={onDeleteProgram}
            onEditProgram={onEditProgram}
          />
        </div>

        {/* Program Details */}
        <div className="lg:col-span-3">
          <ProgramDetails
            selectedProgram={selectedProgram}
            users={users}
            exercises={exercises}
            showNewWeek={showNewWeek}
            setShowNewWeek={setShowNewWeek}
            newWeek={newWeek}
            setNewWeek={setNewWeek}
            onDeleteWeek={onDeleteWeek}
            onDeleteDay={onDeleteDay}
            onDeleteBlock={onDeleteBlock}
            onDeleteExercise={onDeleteExercise}
            onSetCurrentWeek={onSetCurrentWeek}
            onSetCurrentDay={onSetCurrentDay}
            onSetCurrentBlock={onSetCurrentBlock}
            showNewDay={showNewDay}
            setShowNewDay={setShowNewDay}
            newDay={newDay}
            setNewDay={setNewDay}
            showNewBlock={showNewBlock}
            setShowNewBlock={setShowNewBlock}
            newBlock={newBlock}
            setNewBlock={setNewBlock}
            showNewExercise={showNewExercise}
            setShowNewExercise={setShowNewExercise}
            newExercise={newExercise}
            setNewExercise={setNewExercise}
          />
        </div>
      </div>
    </div>
  );
};
