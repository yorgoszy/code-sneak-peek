
import React from 'react';
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
  // ΔΙΟΡΘΩΣΗ: Βελτιωμένη μετατροπή training_dates από Date[] σε string[]
  const selectedDatesAsStrings = (program.training_dates || []).map(date => {
    console.log('🗓️ [ProgramBuilderDialogContent] Processing training date:', date, typeof date);
    
    if (date instanceof Date) {
      // Χρησιμοποιούμε την τοπική ημερομηνία χωρίς timezone conversion
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const result = `${year}-${month}-${day}`;
      console.log('🗓️ [ProgramBuilderDialogContent] Date object converted:', result);
      return result;
    }
    
    // Explicit type check for string
    if (typeof date === 'string') {
      // Αν είναι ήδη string, ελέγχουμε αν έχει timestamp και το αφαιρούμε
      const stringDate = date as string;
      const cleanDate = stringDate.includes('T') ? stringDate.split('T')[0] : stringDate;
      console.log('🗓️ [ProgramBuilderDialogContent] String date cleaned:', cleanDate);
      return cleanDate;
    }
    
    console.log('🗓️ [ProgramBuilderDialogContent] Unknown date format:', date);
    return '';
  }).filter(dateStr => dateStr !== '');

  console.log('🗓️ [ProgramBuilderDialogContent] Final selectedDatesAsStrings:', selectedDatesAsStrings);

  const handleDatesChange = (dates: string[]) => {
    console.log('🗓️ [ProgramBuilderDialogContent] Received dates from selector:', dates);
    
    // ΔΙΟΡΘΩΣΗ: Δημιουργούμε Date objects με τοπική ώρα στο μεσημέρι για consistency
    const dateObjects = dates.map(dateStr => {
      console.log('🗓️ [ProgramBuilderDialogContent] Converting string to Date:', dateStr);
      
      // Διασπάμε το string και δημιουργούμε Date με τοπική ώρα
      const [year, month, day] = dateStr.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day, 12, 0, 0); // 12:00 PM local time
      
      console.log('🗓️ [ProgramBuilderDialogContent] Created Date object:', {
        input: dateStr,
        output: dateObj,
        components: { year, month: month - 1, day },
        verification: `${dateObj.getDate()}/${dateObj.getMonth() + 1}/${dateObj.getFullYear()}`
      });
      
      return dateObj;
    });
    
    console.log('🗓️ [ProgramBuilderDialogContent] Final date objects:', dateObjects);
    onTrainingDatesChange(dateObjects);
  };

  return (
    <DialogContent className="max-w-[95vw] max-h-[95vh] w-[95vw] h-[95vh] rounded-none p-0 flex flex-col">
      <DialogHeader className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
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

      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="space-y-6">
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
      </div>
    </DialogContent>
  );
};
