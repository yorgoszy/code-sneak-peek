
import React, { useState, useEffect } from 'react';
import { Dialog } from "@/components/ui/dialog";
import { User, Exercise, Program } from './types';
import { ProgramBuilderTrigger } from './builder/ProgramBuilderTrigger';
import { ProgramBuilderDialogContent } from './builder/ProgramBuilderDialogContent';
import { useProgramBuilderState } from './builder/hooks/useProgramBuilderState';
import { useProgramBuilderActions } from './builder/hooks/useProgramBuilderActions';

interface ProgramBuilderDialogProps {
  users: User[];
  exercises: Exercise[];
  onCreateProgram: (program: any) => void;
  onOpenChange?: (open: boolean) => void;
  editingProgram?: Program | null;
  isOpen?: boolean;
  showTrigger?: boolean;
}

export const ProgramBuilderDialog: React.FC<ProgramBuilderDialogProps> = ({
  users,
  exercises,
  onCreateProgram,
  onOpenChange,
  editingProgram,
  isOpen = false,
  showTrigger = false
}) => {
  const { program, updateProgram, resetProgram, generateId, loadProgramFromData } = useProgramBuilderState(exercises);
  
  const actions = useProgramBuilderActions(program, (newProgram) => {
    updateProgram(newProgram);
  }, generateId, exercises);

  // Load editing program when it changes
  useEffect(() => {
    if (editingProgram && isOpen) {
      console.log('Loading program for editing:', editingProgram);
      loadProgramFromData(editingProgram);
    }
  }, [editingProgram, isOpen, loadProgramFromData]);

  const handleOpenChange = (open: boolean) => {
    console.log('Builder dialog open change:', open);
    if (onOpenChange) {
      onOpenChange(open);
    }
    if (!open) {
      // Reset program when closing
      setTimeout(() => {
        resetProgram();
      }, 200);
    }
  };

  const handleSaveProgram = () => {
    console.log('Saving program:', program);
    if (!program.name) {
      alert('Το όνομα προγράμματος είναι υποχρεωτικό');
      return;
    }
    onCreateProgram({ ...program, id: editingProgram?.id });
    handleOpenChange(false);
  };

  const handleStartDateChange = (date: Date | undefined) => {
    updateProgram({ start_date: date });
  };

  const handleTrainingDaysChange = (days: string[]) => {
    updateProgram({ training_days: days });
  };

  console.log('ProgramBuilderDialog render - isOpen:', isOpen, 'editingProgram:', editingProgram?.name, 'showTrigger:', showTrigger);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <ProgramBuilderDialogContent
        program={program}
        users={users}
        exercises={exercises}
        onNameChange={(name) => updateProgram({ name })}
        onDescriptionChange={(description) => updateProgram({ description })}
        onAthleteChange={(athlete_id) => updateProgram({ athlete_id })}
        onStartDateChange={handleStartDateChange}
        onTrainingDaysChange={handleTrainingDaysChange}
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
        onSave={handleSaveProgram}
      />
    </Dialog>
  );
};
