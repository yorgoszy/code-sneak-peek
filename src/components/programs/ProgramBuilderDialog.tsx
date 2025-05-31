
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { User, Exercise } from './types';
import { ProgramBuilder } from './builder/ProgramBuilder';
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
  const { program, setProgram, updateProgram, resetProgram, generateId } = useProgramBuilderState(exercises);
  
  const actions = useProgramBuilderActions(program, setProgram, generateId, exercises);

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

  return (
    <>
      <Button className="rounded-none" onClick={() => handleOpenChange(true)}>
        <Plus className="w-4 h-4 mr-2" />
        Νέο Πρόγραμμα
      </Button>

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="rounded-none max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Βοηθός Πληροφοριών</DialogTitle>
          </DialogHeader>
          
          <ProgramBuilder
            program={program}
            users={users}
            exercises={exercises}
            onNameChange={(name) => updateProgram({ name })}
            onDescriptionChange={(description) => updateProgram({ description })}
            onAthleteChange={(athlete_id) => updateProgram({ athlete_id })}
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
          />

          <div className="flex justify-end">
            <Button onClick={handleSaveProgram} className="rounded-none bg-green-600 hover:bg-green-700">
              Αποθήκευση Προγράμματος
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
