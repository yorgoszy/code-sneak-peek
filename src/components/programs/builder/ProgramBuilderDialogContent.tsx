
import React from 'react';
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Save, Users } from "lucide-react";
import { User, Exercise } from '../types';
import { ProgramBuilder } from './ProgramBuilder';
import { TrainingDateSelector } from './TrainingDateSelector';
import { ProgramStructure } from './hooks/useProgramBuilderState';

interface ProgramBuilderDialogContentProps {
  program: ProgramStructure;
  users: User[];
  exercises: Exercise[];
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  onAthleteChange: (user_id: string) => void;
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
  onAssignments: () => void;
  onTrainingDatesChange: (dates: Date[]) => void;
  getTotalTrainingDays: () => number;
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
  onSave,
  onAssignments,
  onTrainingDatesChange,
  getTotalTrainingDays
}) => {
  // Convert training_dates from Date[] to string[] for the TrainingDateSelector
  const selectedDatesAsStrings = program.training_dates?.map(date => {
    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }
    return typeof date === 'string' ? date : '';
  }).filter(Boolean) || [];

  const handleDatesChange = (dates: string[]) => {
    console.log('🗓️ [ProgramBuilderDialogContent] Converting string dates to Date objects:', dates);
    const dateObjects = dates.map(dateStr => new Date(dateStr + 'T00:00:00'));
    console.log('🗓️ [ProgramBuilderDialogContent] Converted dates:', dateObjects);
    onTrainingDatesChange(dateObjects);
  };

  return (
    <DialogContent className="w-screen h-screen max-w-none max-h-none rounded-none p-0 m-0">
      <div className="flex flex-col h-full">
        <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center justify-between">
            <span>{program.name || 'Νέο Πρόγραμμα'}</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onAssignments}
                className="rounded-none"
              >
                <Users className="w-4 h-4 mr-2" />
                Αναθέσεις
              </Button>
              <Button onClick={onSave} className="rounded-none">
                <Save className="w-4 h-4 mr-2" />
                Αποθήκευση
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6 space-y-6">
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

              <Separator />

              <TrainingDateSelector
                selectedDates={selectedDatesAsStrings}
                onDatesChange={handleDatesChange}
                programWeeks={program.weeks?.length || 0}
                weekStructure={program.weeks || []}
              />
            </div>
          </ScrollArea>
        </div>
      </div>
    </DialogContent>
  );
};
