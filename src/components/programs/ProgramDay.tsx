
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { ProgramBlock } from './ProgramBlock';
import { NewBlockDialog } from './NewBlockDialog';

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

interface ProgramDayProps {
  day: Day;
  onDeleteDay: (dayId: string) => void;
  onDeleteBlock: (blockId: string) => void;
  onDeleteExercise: (exerciseId: string) => void;
  onSetCurrentDay: (day: Day) => void;
  onSetCurrentBlock: (block: Block) => void;
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

export const ProgramDay: React.FC<ProgramDayProps> = ({
  day,
  onDeleteDay,
  onDeleteBlock,
  onDeleteExercise,
  onSetCurrentDay,
  onSetCurrentBlock,
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
          <CardTitle className="text-base">{day.name}</CardTitle>
          <div className="flex gap-1">
            <NewBlockDialog
              open={showNewBlock}
              onOpenChange={setShowNewBlock}
              newBlock={newBlock}
              setNewBlock={setNewBlock}
              onCreateBlock={onCreateBlock}
              onSetCurrentDay={() => onSetCurrentDay(day)}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDeleteDay(day.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {day.program_blocks?.map(block => (
            <ProgramBlock
              key={block.id}
              block={block}
              onDeleteBlock={onDeleteBlock}
              onDeleteExercise={onDeleteExercise}
              onSetCurrentBlock={onSetCurrentBlock}
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
