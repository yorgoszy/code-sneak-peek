
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { WeekCard } from './WeekCard';
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

interface Week {
  id: string;
  name: string;
  week_number: number;
  days: Day[];
}

interface TrainingWeeksProps {
  weeks: Week[];
  exercises: Exercise[];
  onAddWeek: () => void;
  onRemoveWeek: (weekId: string) => void;
  onAddDay: (weekId: string) => void;
  onRemoveDay: (weekId: string, dayId: string) => void;
  onAddBlock: (weekId: string, dayId: string) => void;
  onRemoveBlock: (weekId: string, dayId: string, blockId: string) => void;
  onAddExercise: (weekId: string, dayId: string, blockId: string) => void;
  onRemoveExercise: (weekId: string, dayId: string, blockId: string, exerciseId: string) => void;
  onUpdateExercise: (weekId: string, dayId: string, blockId: string, exerciseId: string, field: string, value: any) => void;
}

export const TrainingWeeks: React.FC<TrainingWeeksProps> = ({
  weeks,
  exercises,
  onAddWeek,
  onRemoveWeek,
  onAddDay,
  onRemoveDay,
  onAddBlock,
  onRemoveBlock,
  onAddExercise,
  onRemoveExercise,
  onUpdateExercise
}) => {
  return (
    <Card className="rounded-none">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Εβδομάδες Προπόνησης</CardTitle>
          <Button onClick={onAddWeek} className="rounded-none">
            <Plus className="w-4 h-4 mr-2" />
            +Week
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {weeks.map((week) => (
            <WeekCard
              key={week.id}
              week={week}
              exercises={exercises}
              onAddDay={() => onAddDay(week.id)}
              onRemoveWeek={() => onRemoveWeek(week.id)}
              onAddBlock={(dayId) => onAddBlock(week.id, dayId)}
              onRemoveDay={(dayId) => onRemoveDay(week.id, dayId)}
              onAddExercise={(dayId, blockId) => onAddExercise(week.id, dayId, blockId)}
              onRemoveBlock={(dayId, blockId) => onRemoveBlock(week.id, dayId, blockId)}
              onUpdateExercise={(dayId, blockId, exerciseId, field, value) => 
                onUpdateExercise(week.id, dayId, blockId, exerciseId, field, value)
              }
              onRemoveExercise={(dayId, blockId, exerciseId) => 
                onRemoveExercise(week.id, dayId, blockId, exerciseId)
              }
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
