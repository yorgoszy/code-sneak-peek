
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { ProgramDay } from './ProgramDay';
import { NewDayDialog } from './NewDayDialog';

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

interface ProgramWeekProps {
  week: Week;
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
  exercises: Exercise[];
}

export const ProgramWeek: React.FC<ProgramWeekProps> = ({
  week,
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
  onCreateExercise,
  exercises
}) => {
  return (
    <Card className="rounded-none">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">{week.name}</CardTitle>
          <div className="flex gap-2">
            <NewDayDialog
              open={showNewDay}
              onOpenChange={setShowNewDay}
              newDay={newDay}
              setNewDay={setNewDay}
              onCreateDay={onCreateDay}
              onSetCurrentWeek={() => onSetCurrentWeek(week)}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDeleteWeek(week.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {week.program_days?.map(day => (
            <ProgramDay
              key={day.id}
              day={day}
              onDeleteDay={onDeleteDay}
              onDeleteBlock={onDeleteBlock}
              onDeleteExercise={onDeleteExercise}
              onSetCurrentDay={onSetCurrentDay}
              onSetCurrentBlock={onSetCurrentBlock}
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
