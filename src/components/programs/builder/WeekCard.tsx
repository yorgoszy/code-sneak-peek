
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { DayCard } from './DayCard';
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

interface WeekCardProps {
  week: Week;
  exercises: Exercise[];
  onAddDay: () => void;
  onRemoveWeek: () => void;
  onAddBlock: (dayId: string) => void;
  onRemoveDay: (dayId: string) => void;
  onDuplicateDay: (dayId: string) => void;
  onUpdateDayName: (dayId: string, name: string) => void;
  onAddExercise: (dayId: string, blockId: string) => void;
  onRemoveBlock: (dayId: string, blockId: string) => void;
  onDuplicateBlock: (dayId: string, blockId: string) => void;
  onUpdateBlockName: (dayId: string, blockId: string, name: string) => void;
  onUpdateExercise: (dayId: string, blockId: string, exerciseId: string, field: string, value: any) => void;
  onRemoveExercise: (dayId: string, blockId: string, exerciseId: string) => void;
}

export const WeekCard: React.FC<WeekCardProps> = ({
  week,
  exercises,
  onAddDay,
  onRemoveWeek,
  onAddBlock,
  onRemoveDay,
  onDuplicateDay,
  onUpdateDayName,
  onAddExercise,
  onRemoveBlock,
  onDuplicateBlock,
  onUpdateBlockName,
  onUpdateExercise,
  onRemoveExercise
}) => {
  return (
    <Card className="rounded-none border-2">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-base">{week.name}</CardTitle>
          <div className="flex gap-2">
            <Button 
              onClick={onAddDay}
              size="sm"
              className="rounded-none"
            >
              <Plus className="w-4 h-4 mr-1" />
              +Day
            </Button>
            <Button
              onClick={onRemoveWeek}
              size="sm"
              variant="destructive"
              className="rounded-none"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {week.days.map((day) => (
            <DayCard
              key={day.id}
              day={day}
              exercises={exercises}
              onAddBlock={() => onAddBlock(day.id)}
              onRemoveDay={() => onRemoveDay(day.id)}
              onDuplicateDay={() => onDuplicateDay(day.id)}
              onUpdateDayName={(name) => onUpdateDayName(day.id, name)}
              onAddExercise={(blockId) => onAddExercise(day.id, blockId)}
              onRemoveBlock={(blockId) => onRemoveBlock(day.id, blockId)}
              onDuplicateBlock={(blockId) => onDuplicateBlock(day.id, blockId)}
              onUpdateBlockName={(blockId, name) => onUpdateBlockName(day.id, blockId, name)}
              onUpdateExercise={(blockId, exerciseId, field, value) => 
                onUpdateExercise(day.id, blockId, exerciseId, field, value)
              }
              onRemoveExercise={(blockId, exerciseId) => onRemoveExercise(day.id, blockId, exerciseId)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
