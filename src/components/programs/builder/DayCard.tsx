
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { BlockCard } from './BlockCard';
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

interface Day {
  id: string;
  name: string;
  day_number: number;
  blocks: Block[];
}

interface DayCardProps {
  day: Day;
  exercises: Exercise[];
  onAddBlock: () => void;
  onRemoveDay: () => void;
  onAddExercise: (blockId: string) => void;
  onRemoveBlock: (blockId: string) => void;
  onUpdateExercise: (blockId: string, exerciseId: string, field: string, value: any) => void;
  onRemoveExercise: (blockId: string, exerciseId: string) => void;
}

export const DayCard: React.FC<DayCardProps> = ({
  day,
  exercises,
  onAddBlock,
  onRemoveDay,
  onAddExercise,
  onRemoveBlock,
  onUpdateExercise,
  onRemoveExercise
}) => {
  return (
    <Card className="rounded-none">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm">{day.name}</CardTitle>
          <div className="flex gap-1">
            <Button
              onClick={onAddBlock}
              size="sm"
              variant="ghost"
            >
              <Plus className="w-3 h-3" />
            </Button>
            <Button
              onClick={onRemoveDay}
              size="sm"
              variant="ghost"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {day.blocks.map((block) => (
            <BlockCard
              key={block.id}
              block={block}
              exercises={exercises}
              onAddExercise={() => onAddExercise(block.id)}
              onRemoveBlock={() => onRemoveBlock(block.id)}
              onUpdateExercise={(exerciseId, field, value) => 
                onUpdateExercise(block.id, exerciseId, field, value)
              }
              onRemoveExercise={(exerciseId) => onRemoveExercise(block.id, exerciseId)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
