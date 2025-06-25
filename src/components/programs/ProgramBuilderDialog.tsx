
import React, { useEffect } from 'react';
import { Dialog } from "@/components/ui/dialog";
import { User, Exercise, Program } from './types';
import { ProgramBuilderDialogContent } from './builder/ProgramBuilderDialogContent';
import { useProgramBuilderState } from './builder/hooks/useProgramBuilderState';
import { useProgramBuilderActions } from './builder/hooks/useProgramBuilderActions';
import { useProgramBuilderDialogLogic } from './builder/hooks/useProgramBuilderDialogLogic';

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
  const { program, updateProgram, resetProgram, generateId, loadProgramFromData, getTotalTrainingDays } = useProgramBuilderState(exercises);
  const actions = useProgramBuilderActions(program, updateProgram, generateId, exercises);
  
  const {
    handleClose,
    handleSave,
    handleAssign,
    availableUsers
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

  const handleTrainingDatesChange = (dates: Date[]) => {
    updateProgram({ training_dates: dates });
  };

  const handleAthleteChange = (userId: string) => {
    updateProgram({ 
      user_id: userId,
      is_multiple_assignment: false,
      user_ids: []
    });
  };

  const handleMultipleAthleteChange = (userIds: string[]) => {
    console.log('🔄 ProgramBuilderDialog - handleMultipleAthleteChange called with:', userIds);
    updateProgram({ 
      user_ids: userIds,
      is_multiple_assignment: true,
      user_id: ''
    });
  };

  const handleToggleAssignmentMode = (isMultiple: boolean) => {
    actions.handleToggleAssignmentMode(isMultiple);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <ProgramBuilderDialogContent
        program={program}
        users={users}
        exercises={exercises}
        onNameChange={(name) => updateProgram({ name })}
        onDescriptionChange={(description) => updateProgram({ description })}
        onAthleteChange={handleAthleteChange}
        onMultipleAthleteChange={handleMultipleAthleteChange}
        onToggleAssignmentMode={handleToggleAssignmentMode}
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
        onAssignments={handleAssign}
        onTrainingDatesChange={handleTrainingDatesChange}
        getTotalTrainingDays={getTotalTrainingDays}
      />
    </Dialog>
  );
};
