
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { DayCard } from './DayCard';
import { Exercise, Week, Day, Block, ProgramExercise } from '../types';
import { SortableContext, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

interface WeekCardProps {
  week: Week;
  exercises: Exercise[];
  selectedUserId?: string;
  onAddDay: () => void;
  onRemoveWeek: () => void;
  onDuplicateWeek: () => void;
  onUpdateWeekName: (name: string) => void;
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

const SortableDay: React.FC<{
  day: Day;
  exercises: Exercise[];
  onAddBlock: () => void;
  onRemoveDay: () => void;
  onDuplicateDay: () => void;
  onUpdateDayName: (name: string) => void;
  onAddExercise: (blockId: string, exerciseId: string) => void;
  onRemoveBlock: (blockId: string) => void;
  onDuplicateBlock: (blockId: string) => void;
  onUpdateBlockName: (blockId: string, name: string) => void;
  onUpdateExercise: (blockId: string, exerciseId: string, field: string, value: any) => void;
  onRemoveExercise: (blockId: string, exerciseId: string) => void;
  onDuplicateExercise: (blockId: string, exerciseId: string) => void;
  onReorderBlocks: (oldIndex: number, newIndex: number) => void;
  onReorderExercises: (blockId: string, oldIndex: number, newIndex: number) => void;
}> = (props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.day.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <div
        className="absolute left-0 top-0 bottom-0 w-4 flex items-center justify-center cursor-move z-10"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-3 h-3 text-gray-400" />
      </div>
      <div className="ml-4">
        <DayCard {...props} />
      </div>
    </div>
  );
};

export const WeekCard: React.FC<WeekCardProps> = ({
  week,
  exercises,
  selectedUserId,
  onAddDay,
  onRemoveWeek,
  onDuplicateWeek,
  onUpdateWeekName,
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
      const oldIndex = week.program_days.findIndex(day => day.id === active.id);
      const newIndex = week.program_days.findIndex(day => day.id === over.id);
      onReorderDays(oldIndex, newIndex);
    }
  };

  return (
    <Card className="rounded-none border-2">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">{week.name}</CardTitle>
          <div className="flex gap-2">
            <Button 
              onClick={onAddDay}
              size="sm"
              className="rounded-none text-sm"
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
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={week.program_days.map(d => d.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {week.program_days.map((day) => (
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
                  onRemoveExercise={(blockId, exerciseId) => onRemoveExercise(day.id, blockId, exerciseId)}
                  onDuplicateExercise={(blockId, exerciseId) => onDuplicateExercise(day.id, blockId, exerciseId)}
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
