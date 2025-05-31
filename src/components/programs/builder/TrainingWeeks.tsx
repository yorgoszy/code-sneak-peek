
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Copy } from "lucide-react";
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { DndContext, closestCenter } from '@dnd-kit/core';
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

interface TrainingWeeksProps {
  weeks: Week[];
  exercises: Exercise[];
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
  onDuplicateExercise: (weekId: string, dayId: string, blockId: string, exerciseId: string) => void;
  onUpdateExercise: (weekId: string, dayId: string, blockId: string, exerciseId: string, field: string, value: any) => void;
  onReorderDays: (weekId: string, oldIndex: number, newIndex: number) => void;
  onReorderBlocks: (weekId: string, dayId: string, oldIndex: number, newIndex: number) => void;
  onReorderExercises: (weekId: string, dayId: string, blockId: string, oldIndex: number, newIndex: number) => void;
}

export const TrainingWeeks: React.FC<TrainingWeeksProps> = ({
  weeks,
  exercises,
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
  onDuplicateExercise,
  onUpdateExercise,
  onReorderDays,
  onReorderBlocks,
  onReorderExercises
}) => {
  const handleDragEnd = (weekId: string) => (event: any) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      const week = weeks.find(w => w.id === weekId);
      if (week) {
        const oldIndex = week.days.findIndex(day => day.id === active.id);
        const newIndex = week.days.findIndex(day => day.id === over.id);
        onReorderDays(weekId, oldIndex, newIndex);
      }
    }
  };

  return (
    <div className="space-y-2">
      {weeks.map((week) => (
        <Card key={week.id} className="rounded-none">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-medium">{week.name}</CardTitle>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onAddDay(week.id)}
                  className="h-6 px-2"
                  style={{ borderRadius: '0px' }}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Ημέρα
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDuplicateWeek(week.id)}
                  className="h-6 px-2"
                  style={{ borderRadius: '0px' }}
                >
                  <Copy className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveWeek(week.id)}
                  className="h-6 px-2"
                  style={{ borderRadius: '0px' }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd(week.id)}>
              <SortableContext items={week.days.map(d => d.id)} strategy={horizontalListSortingStrategy}>
                <div className="flex gap-1 overflow-x-auto pb-2">
                  {week.days.map((day) => (
                    <div key={day.id} className="flex-shrink-0" style={{ width: '230px' }}>
                      <SortableDay
                        day={day}
                        exercises={exercises}
                        onAddBlock={() => onAddBlock(week.id, day.id)}
                        onRemoveDay={() => onRemoveDay(week.id, day.id)}
                        onDuplicateDay={() => onDuplicateDay(week.id, day.id)}
                        onUpdateDayName={(name) => onUpdateDayName(week.id, day.id, name)}
                        onAddExercise={(blockId, exerciseId) => onAddExercise(week.id, day.id, blockId, exerciseId)}
                        onRemoveBlock={(blockId) => onRemoveBlock(week.id, day.id, blockId)}
                        onDuplicateBlock={(blockId) => onDuplicateBlock(week.id, day.id, blockId)}
                        onUpdateBlockName={(blockId, name) => onUpdateBlockName(week.id, day.id, blockId, name)}
                        onUpdateExercise={(blockId, exerciseId, field, value) => 
                          onUpdateExercise(week.id, day.id, blockId, exerciseId, field, value)
                        }
                        onRemoveExercise={(blockId, exerciseId) => onRemoveExercise(week.id, day.id, blockId, exerciseId)}
                        onDuplicateExercise={(blockId, exerciseId) => onDuplicateExercise(week.id, day.id, blockId, exerciseId)}
                        onReorderBlocks={(oldIndex, newIndex) => onReorderBlocks(week.id, day.id, oldIndex, newIndex)}
                        onReorderExercises={(blockId, oldIndex, newIndex) => onReorderExercises(week.id, day.id, blockId, oldIndex, newIndex)}
                      />
                    </div>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </CardContent>
        </Card>
      ))}
      
      <Button
        variant="outline"
        onClick={onAddWeek}
        className="w-full rounded-none"
      >
        <Plus className="w-4 h-4 mr-2" />
        Προσθήκη Εβδομάδας
      </Button>
    </div>
  );
};
