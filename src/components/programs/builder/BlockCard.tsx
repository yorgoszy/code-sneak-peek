
import React from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { ExerciseRow } from './ExerciseRow';
import { Exercise } from '../types';

interface ProgramExercise {
  id: string;
  exercise_id: string;
  exercise_name: string;
  sets: number;
  reps: string;
  percentage_1rm: number;
  kg: string;
  velocity_ms: string;
  tempo: string;
  rest: string;
  exercise_order: number;
}

interface Block {
  id: string;
  name: string;
  block_order: number;
  exercises: ProgramExercise[];
}

interface BlockCardProps {
  block: Block;
  exercises: Exercise[];
  onAddExercise: () => void;
  onRemoveBlock: () => void;
  onUpdateExercise: (exerciseId: string, field: string, value: any) => void;
  onRemoveExercise: (exerciseId: string) => void;
}

export const BlockCard: React.FC<BlockCardProps> = ({
  block,
  exercises,
  onAddExercise,
  onRemoveBlock,
  onUpdateExercise,
  onRemoveExercise
}) => {
  return (
    <Card className="rounded-none bg-gray-50">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <h6 className="text-xs font-medium">{block.name}</h6>
          <div className="flex gap-1">
            <Button
              onClick={onAddExercise}
              size="sm"
              variant="ghost"
            >
              <Plus className="w-2 h-2" />
            </Button>
            <Button
              onClick={onRemoveBlock}
              size="sm"
              variant="ghost"
            >
              <Trash2 className="w-2 h-2" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="space-y-2">
          {block.exercises.map((exercise) => (
            <ExerciseRow
              key={exercise.id}
              exercise={exercise}
              exercises={exercises}
              onUpdate={(field, value) => onUpdateExercise(exercise.id, field, value)}
              onRemove={() => onRemoveExercise(exercise.id)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
