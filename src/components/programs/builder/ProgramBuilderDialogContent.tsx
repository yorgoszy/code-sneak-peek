
import React from 'react';
import { DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User, Exercise } from '../types';
import { ProgramBuilder } from './ProgramBuilder';
import { CalendarSection } from './CalendarSection';
import type { ProgramStructure } from './hooks/useProgramBuilderState';

interface ProgramBuilderDialogContentProps {
  program: ProgramStructure;
  users: User[];
  exercises: Exercise[];
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  onAthleteChange: (user_id: string) => void;
  onMultipleAthleteChange: (userIds: string[]) => void;
  onGroupChange: (groupId: string) => void;
  onToggleAssignmentMode: (isMultiple: boolean) => void;
  onAddWeek: () => void;
  onRemoveWeek: (weekId: string) => void;
  onDuplicateWeek: (weekId: string) => void;
  onUpdateWeekName: (weekId: string, name: string) => void;
  onPasteWeek?: (clipboardWeek: any) => void;
  onAddDay: (weekId: string) => void;
  onRemoveDay: (weekId: string, dayId: string) => void;
  onDuplicateDay: (weekId: string, dayId: string) => void;
  onUpdateDayName: (weekId: string, dayId: string, name: string) => void;
  onUpdateDayTestDay: (weekId: string, dayId: string, isTestDay: boolean, testTypes: string[]) => void;
  onUpdateDayCompetitionDay: (weekId: string, dayId: string, isCompetitionDay: boolean) => void;
  onAddBlock: (weekId: string, dayId: string) => void;
  onRemoveBlock: (weekId: string, dayId: string, blockId: string) => void;
  onDuplicateBlock: (weekId: string, dayId: string, blockId: string) => void;
  onUpdateBlockName: (weekId: string, dayId: string, blockId: string, name: string) => void;
  onUpdateBlockTrainingType: (weekId: string, dayId: string, blockId: string, trainingType: string) => void;
  onUpdateBlockWorkoutFormat: (weekId: string, dayId: string, blockId: string, format: string) => void;
  onUpdateBlockWorkoutDuration: (weekId: string, dayId: string, blockId: string, duration: string) => void;
  onUpdateBlockSets: (weekId: string, dayId: string, blockId: string, sets: number) => void;
  onAddExercise: (weekId: string, dayId: string, blockId: string, exerciseId: string) => void;
  onRemoveExercise: (weekId: string, dayId: string, blockId: string, exerciseId: string) => void;
  onUpdateExercise: (weekId: string, dayId: string, blockId: string, exerciseId: string, field: string, value: any) => void;
  onDuplicateExercise: (weekId: string, dayId: string, blockId: string, exerciseId: string) => void;
  onReorderWeeks: (oldIndex: number, newIndex: number) => void;
  onReorderDays: (weekId: string, oldIndex: number, newIndex: number) => void;
  onReorderBlocks: (weekId: string, dayId: string, oldIndex: number, newIndex: number) => void;
  onReorderExercises: (weekId: string, dayId: string, blockId: string, oldIndex: number, newIndex: number) => void;
  onPasteBlock?: (weekId: string, dayId: string, clipboardBlock: any) => void;
  onPasteBlockAtBlock?: (weekId: string, dayId: string, blockId: string, clipboardBlock: any) => void;
  onPasteDay?: (weekId: string, clipboardDay: any) => void;
  onSave: () => Promise<void>;
  onAssignments: () => void;
  onClose?: () => void;
  onTrainingDatesChange: (dates: Date[]) => void;
  getTotalTrainingDays: () => number;
  coachId?: string;
}

export const ProgramBuilderDialogContent: React.FC<ProgramBuilderDialogContentProps> = ({
  program,
  users,
  exercises,
  onNameChange,
  onDescriptionChange,
  onAthleteChange,
  onMultipleAthleteChange,
  onGroupChange,
  onToggleAssignmentMode,
  onAddWeek,
  onRemoveWeek,
  onDuplicateWeek,
  onUpdateWeekName,
  onPasteWeek,
  onAddDay,
  onRemoveDay,
  onDuplicateDay,
  onUpdateDayName,
  onUpdateDayTestDay,
  onUpdateDayCompetitionDay,
  onAddBlock,
  onRemoveBlock,
  onDuplicateBlock,
  onUpdateBlockName,
  onUpdateBlockTrainingType,
  onUpdateBlockWorkoutFormat,
  onUpdateBlockWorkoutDuration,
  onUpdateBlockSets,
  onAddExercise,
  onRemoveExercise,
  onUpdateExercise,
  onDuplicateExercise,
  onReorderWeeks,
  onReorderDays,
  onReorderBlocks,
  onReorderExercises,
  onPasteBlock,
  onPasteBlockAtBlock,
  onPasteDay,
  onSave,
  onAssignments,
  onClose,
  onTrainingDatesChange,
  getTotalTrainingDays,
  coachId
}) => {
  return (
    <DialogContent className="w-screen h-screen max-w-none max-h-none m-0 p-0 rounded-none">
      <ScrollArea className="flex-1 w-full h-full">
        <div className="space-y-2 p-2">
          <ProgramBuilder
            program={program}
            users={users}
            exercises={exercises}
            onNameChange={onNameChange}
            onDescriptionChange={onDescriptionChange}
            onAthleteChange={onAthleteChange}
            onMultipleAthleteChange={onMultipleAthleteChange}
            onGroupChange={onGroupChange}
            onToggleAssignmentMode={onToggleAssignmentMode}
            onAddWeek={onAddWeek}
            onRemoveWeek={onRemoveWeek}
            onDuplicateWeek={onDuplicateWeek}
            onUpdateWeekName={onUpdateWeekName}
            onPasteWeek={onPasteWeek}
            onAddDay={onAddDay}
            onRemoveDay={onRemoveDay}
            onDuplicateDay={onDuplicateDay}
            onUpdateDayName={onUpdateDayName}
            onUpdateDayTestDay={onUpdateDayTestDay}
            onUpdateDayCompetitionDay={onUpdateDayCompetitionDay}
            onAddBlock={onAddBlock}
            onRemoveBlock={onRemoveBlock}
            onDuplicateBlock={onDuplicateBlock}
            onUpdateBlockName={onUpdateBlockName}
            onUpdateBlockTrainingType={onUpdateBlockTrainingType}
            onUpdateBlockWorkoutFormat={onUpdateBlockWorkoutFormat}
            onUpdateBlockWorkoutDuration={onUpdateBlockWorkoutDuration}
            onUpdateBlockSets={onUpdateBlockSets}
            onAddExercise={onAddExercise}
            onRemoveExercise={onRemoveExercise}
            onUpdateExercise={onUpdateExercise}
            onDuplicateExercise={onDuplicateExercise}
            onReorderWeeks={onReorderWeeks}
            onReorderDays={onReorderDays}
            onReorderBlocks={onReorderBlocks}
            onReorderExercises={onReorderExercises}
            onPasteBlock={onPasteBlock}
            onPasteBlockAtBlock={onPasteBlockAtBlock}
            onPasteDay={onPasteDay}
            onSave={onSave}
            onAssignments={onAssignments}
            onClose={onClose}
            coachId={coachId}
          />

          {getTotalTrainingDays() > 0 && (
            <CalendarSection
              program={program}
              totalDays={getTotalTrainingDays()}
              onTrainingDatesChange={onTrainingDatesChange}
              isCoach={!!coachId}
            />
          )}
        </div>
      </ScrollArea>
    </DialogContent>
  );
};
