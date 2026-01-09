import React, { useEffect } from 'react';
import { Dialog } from "@/components/ui/dialog";
import { User, Exercise, Program } from '../types';
import { ProgramBuilderDialogContent } from './ProgramBuilderDialogContent';
import { useProgramBuilderState } from './hooks/useProgramBuilderState';
import { useProgramBuilderActions } from './hooks/useProgramBuilderActions';
import { useCoachProgramBuilderDialogLogic } from './hooks/useCoachProgramBuilderDialogLogic';

interface CoachProgramBuilderDialogProps {
  users: User[]; // coach_users
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
  coachId: string;
}

export const CoachProgramBuilderDialog: React.FC<CoachProgramBuilderDialogProps> = ({
  users,
  exercises,
  onCreateProgram,
  onOpenChange,
  editingProgram,
  editingAssignment,
  isOpen,
  coachId
}) => {
  const { program, updateProgram, resetProgram, generateId, loadProgramFromData, getTotalTrainingDays } = useProgramBuilderState(exercises);
  const actions = useProgramBuilderActions(program, updateProgram, generateId, exercises, onCreateProgram);
  
  const {
    handleClose,
    handleSave,
    handleAssign,
    availableUsers
  } = useCoachProgramBuilderDialogLogic({
    users,
    exercises,
    onCreateProgram,
    onOpenChange,
    editingProgram,
    editingAssignment,
    isOpen,
    program,
    updateProgram,
    coachId
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
    console.log('🔄 CoachProgramBuilderDialog - handleMultipleAthleteChange called with:', userIds);
    updateProgram({ 
      user_ids: userIds,
      is_multiple_assignment: true,
      user_id: ''
    });
  };

  const handleGroupChange = (groupId: string) => {
    updateProgram({ 
      selected_group_id: groupId
    });
  };

  const handleToggleAssignmentMode = (isMultiple: boolean) => {
    actions.handleToggleAssignmentMode(isMultiple);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <ProgramBuilderDialogContent
        onClose={handleClose}
        program={program}
        users={users}
        exercises={exercises}
        onNameChange={(name) => updateProgram({ name })}
        onDescriptionChange={(description) => updateProgram({ description })}
        onAthleteChange={handleAthleteChange}
        onMultipleAthleteChange={handleMultipleAthleteChange}
        onGroupChange={handleGroupChange}
        onToggleAssignmentMode={handleToggleAssignmentMode}
        onAddWeek={actions.addWeek}
        onRemoveWeek={actions.removeWeek}
        onDuplicateWeek={actions.duplicateWeek}
        onUpdateWeekName={actions.updateWeekName}
        onPasteWeek={actions.pasteWeek}
        onAddDay={actions.addDay}
        onRemoveDay={actions.removeDay}
        onDuplicateDay={actions.duplicateDay}
        onUpdateDayName={actions.updateDayName}
        onUpdateDayTestDay={actions.updateDayTestDay}
        onUpdateDayCompetitionDay={actions.updateDayCompetitionDay}
        onUpdateDayBodyFocus={actions.updateDayBodyFocus}
        onAddBlock={actions.addBlock}
        onRemoveBlock={actions.removeBlock}
        onDuplicateBlock={actions.duplicateBlock}
        onUpdateBlockName={actions.updateBlockName}
        onUpdateBlockTrainingType={actions.updateBlockTrainingType}
        onUpdateBlockWorkoutFormat={actions.updateBlockWorkoutFormat}
        onUpdateBlockWorkoutDuration={actions.updateBlockWorkoutDuration}
        onUpdateBlockSets={actions.updateBlockSets}
        onAddExercise={actions.addExercise}
        onRemoveExercise={actions.removeExercise}
        onUpdateExercise={actions.updateExercise}
        onDuplicateExercise={actions.duplicateExercise}
        onReorderWeeks={actions.reorderWeeks}
        onReorderDays={actions.reorderDays}
        onReorderBlocks={actions.reorderBlocks}
        onReorderExercises={actions.reorderExercises}
        onPasteBlock={actions.pasteBlock}
        onPasteBlockAtBlock={actions.pasteBlockAtBlock}
        onPasteDay={actions.pasteDay}
        onLoadBlockTemplate={actions.loadBlockTemplate}
        onSave={handleSave}
        onAssignments={handleAssign}
        onTrainingDatesChange={handleTrainingDatesChange}
        getTotalTrainingDays={getTotalTrainingDays}
        coachId={coachId}
      />
    </Dialog>
  );
};
