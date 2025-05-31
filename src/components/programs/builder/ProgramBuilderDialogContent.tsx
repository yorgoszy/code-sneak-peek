
import React from 'react';
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { User, Exercise } from '../types';
import { ProgramBuilder } from './ProgramBuilder';
import { ProgramStructure } from './hooks/useProgramBuilderState';

interface ProgramBuilderDialogContentProps {
  program: ProgramStructure;
  users: User[];
  exercises: Exercise[];
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  onAthleteChange: (athlete_id: string) => void;
  onAddWeek: () => void;
  onRemoveWeek: (weekId: string) => void;
  onDuplicateWeek: (weekId: string) => void;
  onUpdateWeekName: (weekId: string, name: string) => void;
  onAddDay: (weekId: string) => void;
  onRemoveDay: (weekId: string, dayId: string) => void;
  onDuplicateDay: (weekId: string, dayId: string) => void;
  onUpdateDayName: (weekId: string, dayId: string, name: string) => void;
  onAddBlock: (weekId: string, dayId: string) => void;
  onRemoveBlock: (weekId: string, dayId: string, blockId: string) => void;
  onDuplicateBlock: (weekId: string, dayId: string, blockId: string) => void;
  onUpdateBlockName: (weekId: string, dayId: string, blockId: string, name: string) => void;
  onAddExercise: (weekId: string, dayId: string, blockId: string, exerciseId: string) => void;
  onRemoveExercise: (weekId: string, dayId: string, blockId: string, exerciseId: string) => void;
  onUpdateExercise: (weekId: string, dayId: string, blockId: string, exerciseId: string, field: string, value: any) => void;
  onDuplicateExercise: (weekId: string, dayId: string, blockId: string, exerciseId: string) => void;
  onReorderWeeks: (oldIndex: number, newIndex: number) => void;
  onReorderDays: (weekId: string, oldIndex: number, newIndex: number) => void;
  onReorderBlocks: (weekId: string, dayId: string, oldIndex: number, newIndex: number) => void;
  onReorderExercises: (weekId: string, dayId: string, blockId: string, oldIndex: number, newIndex: number) => void;
  onSave: () => void;
}

export const ProgramBuilderDialogContent: React.FC<ProgramBuilderDialogContentProps> = ({
  program,
  users,
  exercises,
  onNameChange,
  onDescriptionChange,
  onAthleteChange,
  onAddWeek,
  onRemoveWeek,
  onDuplicateWeek,
  onUpdateWeekName,
  onAddDay,
  onRemoveDay,
  onDuplicateDay,
  onUpdateDayName,
  onAddBlock,
  onRemoveBlock,
  onDuplicateBlock,
  onUpdateBlockName,
  onAddExercise,
  onRemoveExercise,
  onUpdateExercise,
  onDuplicateExercise,
  onReorderWeeks,
  onReorderDays,
  onReorderBlocks,
  onReorderExercises,
  onSave
}) => {
  return (
    <DialogContent className="rounded-none w-screen h-screen max-w-none max-h-none m-0 p-0 overflow-hidden flex flex-col">
      <DialogHeader className="px-6 py-4 border-b">
        <DialogTitle>Βοηθός Πληροφοριών</DialogTitle>
      </DialogHeader>
      
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <ProgramBuilder
          program={program}
          users={users}
          exercises={exercises}
          onNameChange={onNameChange}
          onDescriptionChange={onDescriptionChange}
          onAthleteChange={onAthleteChange}
          onAddWeek={onAddWeek}
          onRemoveWeek={onRemoveWeek}
          onDuplicateWeek={onDuplicateWeek}
          onUpdateWeekName={onUpdateWeekName}
          onAddDay={onAddDay}
          onRemoveDay={onRemoveDay}
          onDuplicateDay={onDuplicateDay}
          onUpdateDayName={onUpdateDayName}
          onAddBlock={onAddBlock}
          onRemoveBlock={onRemoveBlock}
          onDuplicateBlock={onDuplicateBlock}
          onUpdateBlockName={onUpdateBlockName}
          onAddExercise={onAddExercise}
          onRemoveExercise={onRemoveExercise}
          onUpdateExercise={onUpdateExercise}
          onDuplicateExercise={onDuplicateExercise}
          onReorderWeeks={onReorderWeeks}
          onReorderDays={onReorderDays}
          onReorderBlocks={onReorderBlocks}
          onReorderExercises={onReorderExercises}
        />
      </div>

      <div className="flex justify-end px-6 py-4 border-t">
        <Button onClick={onSave} className="rounded-none bg-green-600 hover:bg-green-700">
          Αποθήκευση Προγράμματος
        </Button>
      </div>
    </DialogContent>
  );
};
