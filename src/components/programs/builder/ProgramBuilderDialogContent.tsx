
import React from 'react';
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Save, Users, Calendar } from "lucide-react";
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
  onSave: () => Promise<void>;
  onAssignments: () => void;
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
  onSave,
  onAssignments,
  onTrainingDatesChange,
  getTotalTrainingDays,
  coachId
}) => {
  const canAssign = program.user_ids && program.user_ids.length > 0 && 
                   program.training_dates && program.training_dates.length > 0 &&
                   program.name?.trim();

  return (
    <DialogContent className="w-screen h-screen max-w-none max-h-none m-0 p-0 rounded-none">
      <DialogHeader className="flex-shrink-0 p-3 md:p-6 border-b">
        <DialogTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <span className="text-sm md:text-base font-semibold">Δημιουργία Προγράμματος Προπόνησης</span>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              onClick={onSave}
              variant="outline"
              className="bg-white hover:bg-gray-100 text-black rounded-none flex-1 sm:flex-none text-xs md:text-sm"
              size="sm"
            >
              <Save className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Αποθήκευση</span>
              <span className="sm:hidden">Αποθ.</span>
            </Button>
            <Button
              onClick={onAssignments}
              disabled={!canAssign}
              className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none flex-1 sm:flex-none text-xs md:text-sm"
              size="sm"
              title={!canAssign ? "Επιλέξτε χρήστες και ημερομηνίες προπόνησης" : ""}
            >
              <Users className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Ανάθεση</span>
              <span className="sm:hidden">Αν.</span>
            </Button>
          </div>
        </DialogTitle>
      </DialogHeader>

      <ScrollArea className="flex-1 w-full h-full">
        <div className="space-y-3 p-3 md:p-4">
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
            coachId={coachId}
          />

          {getTotalTrainingDays() > 0 && (
            <CalendarSection
              program={program}
              totalDays={getTotalTrainingDays()}
              onTrainingDatesChange={onTrainingDatesChange}
            />
          )}
        </div>
      </ScrollArea>
    </DialogContent>
  );
};
