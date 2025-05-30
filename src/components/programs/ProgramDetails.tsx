
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgramWeek } from './ProgramWeek';
import { NewWeekDialog } from './NewWeekDialog';

interface User {
  id: string;
  name: string;
  email: string;
}

interface Exercise {
  id: string;
  name: string;
}

interface ProgramExercise {
  id: string;
  exercise_id: string;
  sets: number;
  reps: string;
  kg: string;
  percentage_1rm?: number;
  velocity_ms?: number;
  tempo?: string;
  rest?: string;
  notes?: string;
  exercise_order: number;
  exercises?: { name: string };
}

interface Block {
  id: string;
  name: string;
  block_order: number;
  program_exercises: ProgramExercise[];
}

interface Day {
  id: string;
  name: string;
  day_number: number;
  program_blocks: Block[];
}

interface Week {
  id: string;
  name: string;
  week_number: number;
  program_days: Day[];
}

interface Program {
  id: string;
  name: string;
  description?: string;
  athlete_id?: string;
  app_users?: { name: string };
  program_weeks: Week[];
}

interface ProgramDetailsProps {
  selectedProgram: Program | null;
  users: User[];
  exercises: Exercise[];
  showNewWeek: boolean;
  setShowNewWeek: (show: boolean) => void;
  newWeek: { name: string; week_number: number };
  setNewWeek: (week: { name: string; week_number: number }) => void;
  onCreateWeek: () => void;
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
  onCreateDay: () => void;
  showNewBlock: boolean;
  setShowNewBlock: (show: boolean) => void;
  newBlock: { name: string; block_order: number };
  setNewBlock: (block: { name: string; block_order: number }) => void;
  onCreateBlock: () => void;
  showNewExercise: boolean;
  setShowNewExercise: (show: boolean) => void;
  newExercise: any;
  setNewExercise: (exercise: any) => void;
  onCreateExercise: () => void;
}

export const ProgramDetails: React.FC<ProgramDetailsProps> = ({
  selectedProgram,
  users,
  exercises,
  showNewWeek,
  setShowNewWeek,
  newWeek,
  setNewWeek,
  onCreateWeek,
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
  onCreateDay,
  showNewBlock,
  setShowNewBlock,
  newBlock,
  setNewBlock,
  onCreateBlock,
  showNewExercise,
  setShowNewExercise,
  newExercise,
  setNewExercise,
  onCreateExercise
}) => {
  if (!selectedProgram) {
    return (
      <Card className="rounded-none">
        <CardContent className="p-12 text-center">
          <p className="text-gray-500">Επιλέξτε ένα πρόγραμμα για να δείτε τις λεπτομέρειες</p>
        </CardContent>
      </Card>
    );
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
            onCreateWeek={onCreateWeek}
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
              onCreateDay={onCreateDay}
              showNewBlock={showNewBlock}
              setShowNewBlock={setShowNewBlock}
              newBlock={newBlock}
              setNewBlock={setNewBlock}
              onCreateBlock={onCreateBlock}
              showNewExercise={showNewExercise}
              setShowNewExercise={setShowNewExercise}
              newExercise={newExercise}
              setNewExercise={setNewExercise}
              onCreateExercise={onCreateExercise}
              exercises={exercises}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
