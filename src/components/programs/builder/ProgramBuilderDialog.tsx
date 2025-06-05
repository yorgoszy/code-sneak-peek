
import React, { useEffect } from 'react';
import { Dialog } from "@/components/ui/dialog";
import { User, Exercise, Program } from '../types';
import { ProgramBuilderDialogContent } from './ProgramBuilderDialogContent';
import { ProgramAssignmentDialog } from './ProgramAssignmentDialog';
import { useProgramBuilderState } from './hooks/useProgramBuilderState';
import { useProgramBuilderActions } from './hooks/useProgramBuilderActions';
import { useProgramBuilderDialogLogic } from './hooks/useProgramBuilderDialogLogic';

interface ProgramBuilderDialogProps {
  users: User[];
  exercises: Exercise[];
  onCreateProgram: (program: any) => Promise<any>;
  onOpenChange: () => void;
  editingProgram?: Program | null;
  editingAssignment?: {
    id: string;
    user_id: string;
    training_dates: string[];
  } | null;
  isOpen: boolean;
}

export const ProgramBuilderDialog: React.FC<ProgramBuilderDialogProps> = ({
  users,
  exercises,
  onCreateProgram,
  onOpenChange,
  editingProgram,
  editingAssignment,
  isOpen
}) => {
  const { program, updateProgram, resetProgram, generateId, loadProgramFromData } = useProgramBuilderState(exercises);
  const actions = useProgramBuilderActions(program, updateProgram, generateId, exercises);
  
  const {
    assignmentDialogOpen,
    setAssignmentDialogOpen,
    preSelectedDates,
    handleClose,
    handleSave,
    handleOpenAssignments,
    handleAssign,
    availableUsers,
    assignmentEditData
  } = useProgramBuilderDialogLogic({
    users,
    exercises,
    onCreateProgram,
    onOpenChange,
    editingProgram,
    editingAssignment,
    isOpen,
    program
  });

  useEffect(() => {
    if (isOpen) {
      if (editingProgram) {
        console.log('Loading program for editing:', editingProgram);
        loadProgramFromData(editingProgram);
      } else {
        console.log('Resetting program for new creation');
        resetProgram();
      }
    }
  }, [editingProgram, isOpen]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <ProgramBuilderDialogContent
          program={program}
          users={users}
          exercises={exercises}
          onNameChange={(name) => updateProgram({ name })}
          onDescriptionChange={(description) => updateProgram({ description })}
          onAthleteChange={(user_id) => updateProgram({ user_id })}
          onAddWeek={actions.addWeek}
          onRemoveWeek={actions.removeWeek}
          onDuplicateWeek={actions.duplicateWeek}
          onUpdateWeekName={actions.updateWeekName}
          onAddDay={actions.addDay}
          onRemoveDay={actions.removeDay}
          onDuplicateDay={actions.duplicateDay}
          onUpdateDayName={actions.updateDayName}
          onAddBlock={actions.addBlock}
          onRemoveBlock={actions.removeBlock}
          onDuplicateBlock={actions.duplicateBlock}
          onUpdateBlockName={actions.updateBlockName}
          onAddExercise={actions.addExercise}
          onRemoveExercise={actions.removeExercise}
          onUpdateExercise={actions.updateExercise}
          onDuplicateExercise={actions.duplicateExercise}
          onReorderWeeks={actions.reorderWeeks}
          onReorderDays={actions.reorderDays}
          onReorderBlocks={actions.reorderBlocks}
          onReorderExercises={actions.reorderExercises}
          onSave={handleSave}
          onAssignments={handleOpenAssignments}
        />
      </Dialog>

      <ProgramAssignmentDialog
        isOpen={assignmentDialogOpen}
        onClose={() => setAssignmentDialogOpen(false)}
        program={program}
        users={availableUsers}
        onAssign={handleAssign}
        editingAssignment={assignmentEditData}
        preSelectedDates={preSelectedDates}
      />
    </>
  );
};
