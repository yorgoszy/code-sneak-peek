
import React, { useState } from 'react';
import { Dialog } from "@/components/ui/dialog";
import { User, Exercise } from './types';
import { ProgramBuilderTrigger } from './builder/ProgramBuilderTrigger';
import { ProgramBuilderDialogContent } from './builder/ProgramBuilderDialogContent';
import { useProgramBuilderState } from './builder/hooks/useProgramBuilderState';
import { useProgramBuilderActions } from './builder/hooks/useProgramBuilderActions';

interface ProgramBuilderDialogProps {
  users: User[];
  exercises: Exercise[];
  onCreateProgram: (program: any) => void;
  onOpenChange?: (open: boolean) => void;
}

export const ProgramBuilderDialog: React.FC<ProgramBuilderDialogProps> = ({
  users,
  exercises,
  onCreateProgram,
  onOpenChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { program, updateProgram, resetProgram, generateId } = useProgramBuilderState(exercises);
  
  const actions = useProgramBuilderActions(program, (newProgram) => {
    // Update the program state when actions modify it
    updateProgram(newProgram);
  }, generateId, exercises);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (onOpenChange) {
      onOpenChange(open);
    }
  };

  const handleSaveProgram = () => {
    if (!program.name) {
      alert('Το όνομα προγράμματος είναι υποχρεωτικό');
      return;
    }
    onCreateProgram(program);
    setIsOpen(false);
    resetProgram();
  };

  const handleStartDateChange = (date: Date | undefined) => {
    updateProgram({ start_date: date });
  };

  const handleTrainingDaysChange = (days: string[]) => {
    updateProgram({ training_days: days });
  };

  return (
    <>
      <ProgramBuilderTrigger onClick={() => handleOpenChange(true)} />

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
