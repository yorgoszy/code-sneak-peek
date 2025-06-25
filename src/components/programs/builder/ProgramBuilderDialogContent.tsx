
import React from 'react';
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Save, Calendar } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User, Exercise } from '../types';
import { ProgramBuilder } from './ProgramBuilder';
import { CalendarSection } from './CalendarSection';
import { ProgramStructure } from './hooks/useProgramBuilderState';
import { AssignmentHandler } from './AssignmentHandler';

interface ProgramBuilderDialogContentProps {
  program: ProgramStructure;
  users: User[];
  exercises: Exercise[];
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  onAthleteChange: (userId: string) => void;
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
  const { handleAssignment } = AssignmentHandler({ program, getTotalTrainingDays });

  const handleMultipleAthleteChange = (userIds: string[]) => {
    // Ενημερώνουμε το program state με τους επιλεγμένους χρήστες
    // Αυτό θα πρέπει να συνδεθεί με το updateProgram από το parent
    console.log('Multiple athletes selected:', userIds);
  };

  const handleToggleAssignmentMode = (isMultiple: boolean) => {
    // Αλλάζουμε τον τρόπο ανάθεσης
    console.log('Toggle assignment mode:', isMultiple);
  };

  const canSaveAndAssign = () => {
    if (!program.name?.trim()) return false;
    if (program.is_multiple_assignment) {
      return (program.user_ids?.length || 0) > 0;
    } else {
      return !!program.user_id;
    }
  };

  const totalDays = getTotalTrainingDays();
  const selectedDatesCount = program.training_dates?.length || 0;

  return (
    <DialogContent className="max-w-7xl h-[90vh] rounded-none flex flex-col">
      <DialogHeader className="flex-shrink-0 border-b pb-4">
        <DialogTitle className="text-xl font-semibold">
          Δημιουργία Προγράμματος Προπόνησης
        </DialogTitle>
      </DialogHeader>

      <ScrollArea className="flex-1 px-6">
        <div className="space-y-6 py-6">
          <ProgramBuilder
            program={program}
            users={users}
            exercises={exercises}
            onNameChange={onNameChange}
            onDescriptionChange={onDescriptionChange}
            onAthleteChange={onAthleteChange}
            onMultipleAthleteChange={handleMultipleAthleteChange}
            onToggleAssignmentMode={handleToggleAssignmentMode}
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

          {totalDays > 0 && (
            <CalendarSection
              program={program}
              totalDays={totalDays}
              onTrainingDatesChange={onTrainingDatesChange}
            />
          )}
        </div>
      </ScrollArea>

      <div className="flex-shrink-0 flex justify-between items-center p-6 border-t bg-white">
        <div className="text-sm text-gray-600">
          {program.is_multiple_assignment && (program.user_ids?.length || 0) > 0 && (
            <span>Επιλεγμένοι αθλητές: {program.user_ids?.length}</span>
          )}
          {totalDays > 0 && (
            <span className="ml-4">
              Ημερομηνίες: {selectedDatesCount}/{totalDays}
            </span>
          )}
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" onClick={onSave} className="rounded-none">
            <Save className="w-4 h-4 mr-2" />
            Αποθήκευση
          </Button>
          
          <Button
            onClick={handleAssignment}
            disabled={!canSaveAndAssign() || selectedDatesCount < totalDays}
            className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
          >
            <Calendar className="w-4 h-4 mr-2" />
            {program.is_multiple_assignment ? 'Ανάθεση σε Πολλαπλούς' : 'Ανάθεση'}
          </Button>
        </div>
      </div>
    </DialogContent>
  );
};
