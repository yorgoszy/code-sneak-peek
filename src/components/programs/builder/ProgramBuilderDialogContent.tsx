
import React from 'react';
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProgramBasicInfo } from './ProgramBasicInfo';
import { TrainingWeeks } from './TrainingWeeks';
import { CalendarSection } from './CalendarSection';
import { ActionButtons } from './ActionButtons';
import { useAssignmentHandler } from './AssignmentHandler';
import type { User, Exercise } from '../types';
import type { ProgramStructure } from './hooks/useProgramBuilderState';

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
  onTrainingDatesChange?: (dates: Date[]) => void;
  getTotalTrainingDays?: () => number;
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
  const totalDays = getTotalTrainingDays ? getTotalTrainingDays() : 0;
  const { handleAssignment } = useAssignmentHandler({ program, getTotalTrainingDays });

  return (
    <DialogContent className="max-w-[100vw] max-h-[100vh] w-[100vw] h-[100vh] rounded-none flex flex-col p-0 md:max-w-[90vw] md:max-h-[90vh] md:w-[90vw] md:h-[90vh]">
      <DialogHeader className="flex-shrink-0 p-3 md:p-6 border-b">
        <DialogTitle className="text-sm md:text-base">
          {program.id ? 'Επεξεργασία Προγράμματος' : 'Δημιουργία Νέου Προγράμματος'}
        </DialogTitle>
      </DialogHeader>
      
      <ScrollArea className="flex-1 h-full">
        <div className="space-y-3 md:space-y-6 p-3 md:p-6">
          <ProgramBasicInfo
            name={program.name}
            description={program.description || ''}
            selectedUserId={program.user_id}
            users={users}
            onNameChange={onNameChange}
            onDescriptionChange={onDescriptionChange}
            onAthleteChange={onAthleteChange}
          />

          <TrainingWeeks
            weeks={program.weeks || []}
            exercises={exercises}
            selectedUserId={program.user_id}
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

          {onTrainingDatesChange && (
            <CalendarSection
              program={program}
              totalDays={totalDays}
              onTrainingDatesChange={onTrainingDatesChange}
            />
          )}
        </div>
      </ScrollArea>

      <ActionButtons
        program={program}
        totalDays={totalDays}
        onSave={onSave}
        onAssignment={handleAssignment}
      />
    </DialogContent>
  );
};
