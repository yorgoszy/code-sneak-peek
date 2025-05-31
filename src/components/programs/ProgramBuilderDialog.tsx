
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
}

export const ProgramBuilderDialog: React.FC<ProgramBuilderDialogProps> = ({
  users,
  exercises,
  onCreateProgram,
  onOpenChange,
  editingProgram,
  isOpen: externalIsOpen
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  
  const { program, updateProgram, resetProgram, generateId, loadProgramFromData } = useProgramBuilderState(exercises);
  
  const actions = useProgramBuilderActions(program, (newProgram) => {
    updateProgram(newProgram);
  }, generateId, exercises);

  // Load editing program when it changes
  useEffect(() => {
    if (editingProgram && isOpen) {
      loadProgramFromData(editingProgram);
    }
  }, [editingProgram, isOpen, loadProgramFromData]);

  const handleOpenChange = (open: boolean) => {
    if (externalIsOpen === undefined) {
      setInternalIsOpen(open);
    }
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

  return (
    <>
      {externalIsOpen === undefined && (
        <ProgramBuilderTrigger onClick={() => handleOpenChange(true)} />
      )}

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
    </>
  );
};
