
import React from 'react';
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Users } from "lucide-react";
import { TrainingWeeks } from './TrainingWeeks';
import { CalendarAssignment } from './CalendarAssignment';
import { Exercise, User } from '../types';
import type { ProgramStructure } from './hooks/useProgramBuilderState';

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
  return (
    <DialogContent className="w-screen h-screen max-w-none max-h-none m-0 p-0 rounded-none overflow-y-auto">
      <div className="p-6">
        <DialogHeader>
          <DialogTitle>Δημιουργία Προγράμματος</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Βασικές Πληροφορίες */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="program-name">Όνομα Προγράμματος</Label>
              <Input
                id="program-name"
                value={program.name || ''}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder="Εισάγετε όνομα προγράμματος..."
                className="rounded-none"
              />
            </div>
            
            <div>
              <Label htmlFor="athlete-select">Αθλητής</Label>
              <Select value={program.user_id || ''} onValueChange={onAthleteChange}>
                <SelectTrigger className="rounded-none">
                  <SelectValue placeholder="Επιλέξτε αθλητή..." />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="program-description">Περιγραφή</Label>
            <Textarea
              id="program-description"
              value={program.description || ''}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="Περιγραφή προγράμματος..."
              className="rounded-none"
              rows={3}
            />
          </div>

          {/* Εβδομάδες Προπόνησης */}
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

          {/* Ημερολόγιο Ανάθεσης */}
          <CalendarAssignment
            program={program}
            onTrainingDatesChange={onTrainingDatesChange}
          />

          {/* Κουμπιά Ενεργειών */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              onClick={onAssignments}
              variant="outline"
              className="rounded-none"
            >
              <Users className="w-4 h-4 mr-2" />
              Αναθέσεις
            </Button>
            <Button
              onClick={onSave}
              className="rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black"
            >
              <Save className="w-4 h-4 mr-2" />
              Αποθήκευση
            </Button>
          </div>
        </div>
      </div>
    </DialogContent>
  );
};
