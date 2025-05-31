
import React, { useState, useEffect } from 'react';
import { Dialog } from "@/components/ui/dialog";
import { User, Exercise, Program } from './types';
import { ProgramBuilderDialogContent } from './builder/ProgramBuilderDialogContent';
import { useProgramBuilderState } from './builder/hooks/useProgramBuilderState';
import { useProgramBuilderActions } from './builder/hooks/useProgramBuilderActions';

interface ProgramBuilderDialogProps {
  users: User[];
  exercises: Exercise[];
  onCreateProgram: (program: any) => void;
  onOpenChange: () => void;
  editingProgram?: Program | null;
  isOpen: boolean;
}

export const ProgramBuilderDialog: React.FC<ProgramBuilderDialogProps> = ({
  users,
  exercises,
  onCreateProgram,
  onOpenChange,
  editingProgram,
  isOpen
}) => {
  const { program, updateProgram, resetProgram, generateId, loadProgramFromData } = useProgramBuilderState(exercises);
  
  const actions = useProgramBuilderActions(program, updateProgram, generateId, exercises);

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

  const handleClose = () => {
    onOpenChange();
  };

  const handleSave = () => {
    if (!program.name.trim()) {
      alert('Το όνομα προγράμματος είναι υποχρεωτικό');
      return;
    }
    
    console.log('Saving program:', program);
    const programToSave = {
      ...program,
      id: editingProgram?.id || undefined
    };
    
    onCreateProgram(programToSave);
    handleClose();
  };

  // Convert start_date string to Date object for ProgramCalendar
  const startDateAsDate = program.start_date ? new Date(program.start_date) : undefined;

  // Convert training_days number to empty array since ProgramCalendar expects string[] for day names
  const trainingDaysAsArray: string[] = [];

  const handleStartDateChange = (date: Date | undefined) => {
    const dateString = date ? date.toISOString().split('T')[0] : '';
    updateProgram({ start_date: dateString });
  };

  const handleTrainingDaysChange = (days: string[]) => {
    // Convert string[] back to number for storage
    updateProgram({ training_days: days.length });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
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
        onSave={handleSave}
      />
    </Dialog>
  );
};
