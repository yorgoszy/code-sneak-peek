
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableDay } from './SortableDay';
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
  onAddExercise: (dayId: string, blockId: string, exerciseId: string) => void;
  onRemoveBlock: (dayId: string, blockId: string) => void;
  onDuplicateBlock: (dayId: string, blockId: string) => void;
  onUpdateBlockName: (dayId: string, blockId: string, name: string) => void;
  onUpdateExercise: (dayId: string, blockId: string, exerciseId: string, field: string, value: any) => void;
  onRemoveExercise: (dayId: string, blockId: string, exerciseId: string) => void;
  onDuplicateExercise: (dayId: string, blockId: string, exerciseId: string) => void;
  onReorderDays: (oldIndex: number, newIndex: number) => void;
  onReorderBlocks: (dayId: string, oldIndex: number, newIndex: number) => void;
  onReorderExercises: (dayId: string, blockId: string, oldIndex: number, newIndex: number) => void;
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
  onRemoveExercise,
  onDuplicateExercise,
  onReorderDays,
  onReorderBlocks,
  onReorderExercises
}) => {
  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = week.days.findIndex(day => day.id === active.id);
      const newIndex = week.days.findIndex(day => day.id === over.id);
      onReorderDays(oldIndex, newIndex);
    }
  };

  return (
    <Card className="rounded-none">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">{week.name}</CardTitle>
          <Button onClick={onAddDay} className="rounded-none">
            <Plus className="w-4 h-4 mr-2" />
            +Day
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={week.days.map(d => d.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-4">
              {week.days.map((day) => (
                <SortableDay
                  key={day.id}
                  day={day}
                  exercises={exercises}
                  onAddBlock={() => onAddBlock(day.id)}
                  onRemoveDay={() => onRemoveDay(day.id)}
                  onDuplicateDay={() => onDuplicateDay(day.id)}
                  onUpdateDayName={(name) => onUpdateDayName(day.id, name)}
                  onAddExercise={(blockId, exerciseId) => onAddExercise(day.id, blockId, exerciseId)}
                  onRemoveBlock={(blockId) => onRemoveBlock(day.id, blockId)}
                  onDuplicateBlock={(blockId) => onDuplicateBlock(day.id, blockId)}
                  onUpdateBlockName={(blockId, name) => onUpdateBlockName(day.id, blockId, name)}
                  onUpdateExercise={(blockId, exerciseId, field, value) => 
                    onUpdateExercise(day.id, blockId, exerciseId, field, value)
                  }
                  onRemoveExercise={(blockId, exerciseId) => 
                    onRemoveExercise(day.id, blockId, exerciseId)
                  }
                  onDuplicateExercise={(blockId, exerciseId) => 
                    onDuplicateExercise(day.id, blockId, exerciseId)
                  }
                  onReorderBlocks={(oldIndex, newIndex) => onReorderBlocks(day.id, oldIndex, newIndex)}
                  onReorderExercises={(blockId, oldIndex, newIndex) => onReorderExercises(day.id, blockId, oldIndex, newIndex)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </CardContent>
    </Card>
  );
};
