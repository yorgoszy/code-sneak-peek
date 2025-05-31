
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgramWeek } from './ProgramWeek';
import { NewWeekDialog } from './NewWeekDialog';
import { Program, User, Exercise, Week, Day, Block } from './types';

interface ProgramDetailsProps {
  selectedProgram: Program | null;
  users: User[];
  exercises: Exercise[];
  showNewWeek: boolean;
  setShowNewWeek: (show: boolean) => void;
  newWeek: { name: string; week_number: number };
  setNewWeek: (week: { name: string; week_number: number }) => void;
  onDeleteWeek: (weekId: string) => void;
  onDeleteDay: (dayId: string) => void;
  onDeleteBlock: (blockId: string) => void;
  onDeleteExercise: (exerciseId: string) => void;
  onSetCurrentWeek: (week: Week) => void;
  onSetCurrentDay: (day: Day) => void;
  onSetCurrentBlock: (block: Block) => void;
  showNewDay: boolean;
  setShowNewDay: (show: boolean) => void;
  newDay: { name: string; day_number: number };
  setNewDay: (day: { name: string; day_number: number }) => void;
  showNewBlock: boolean;
  setShowNewBlock: (show: boolean) => void;
  newBlock: { name: string; block_order: number };
  setNewBlock: (block: { name: string; block_order: number }) => void;
  showNewExercise: boolean;
  setShowNewExercise: (show: boolean) => void;
  newExercise: any;
  setNewExercise: (exercise: any) => void;
}

export const ProgramDetails: React.FC<ProgramDetailsProps> = ({
  selectedProgram,
  users,
  exercises,
  showNewWeek,
  setShowNewWeek,
  newWeek,
  setNewWeek,
  onDeleteWeek,
  onDeleteDay,
  onDeleteBlock,
  onDeleteExercise,
  onSetCurrentWeek,
  onSetCurrentDay,
  onSetCurrentBlock,
  showNewDay,
  setShowNewDay,
  newDay,
  setNewDay,
  showNewBlock,
  setShowNewBlock,
  newBlock,
  setNewBlock,
  showNewExercise,
  setShowNewExercise,
  newExercise,
  setNewExercise
}) => {
  if (!selectedProgram) {
    return null;
  }

  return (
    <Card className="rounded-none">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{selectedProgram.name}</CardTitle>
          <NewWeekDialog
            open={showNewWeek}
            onOpenChange={setShowNewWeek}
            newWeek={newWeek}
            setNewWeek={setNewWeek}
            onCreateWeek={() => {}} // Empty function since we're using builder now
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {selectedProgram.program_weeks?.map(week => (
            <ProgramWeek
              key={week.id}
              week={week}
              onDeleteWeek={onDeleteWeek}
              onDeleteDay={onDeleteDay}
              onDeleteBlock={onDeleteBlock}
              onDeleteExercise={onDeleteExercise}
              onSetCurrentWeek={onSetCurrentWeek}
              onSetCurrentDay={onSetCurrentDay}
              onSetCurrentBlock={onSetCurrentBlock}
              showNewDay={showNewDay}
              setShowNewDay={setShowNewDay}
              newDay={newDay}
              setNewDay={setNewDay}
              onCreateDay={() => {}} // Empty function since we're using builder now
              showNewBlock={showNewBlock}
              setShowNewBlock={setShowNewBlock}
              newBlock={newBlock}
              setNewBlock={setNewBlock}
              onCreateBlock={() => {}} // Empty function since we're using builder now
              showNewExercise={showNewExercise}
              setShowNewExercise={setShowNewExercise}
              newExercise={newExercise}
              setNewExercise={setNewExercise}
              onCreateExercise={() => {}} // Empty function since we're using builder now
              exercises={exercises}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
