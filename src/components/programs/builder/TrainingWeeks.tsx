
import React from 'react';
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Exercise, Week } from '../types';
import { SortableWeekCard } from './SortableWeekCard';

interface TrainingWeeksProps {
  weeks: Week[];
  exercises: Exercise[];
  selectedUserId?: string;
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
  onUpdateExercise: (weekId: string, dayId: string, blockId: string, exerciseId: string, field: string, value: any) => void;
  onDuplicateExercise: (weekId: string, dayId: string, blockId: string, exerciseId: string) => void;
  onReorderWeeks: (oldIndex: number, newIndex: number) => void;
  onReorderDays: (weekId: string, oldIndex: number, newIndex: number) => void;
  onReorderBlocks: (weekId: string, dayId: string, oldIndex: number, newIndex: number) => void;
  onReorderExercises: (weekId: string, dayId: string, blockId: string, oldIndex: number, newIndex: number) => void;
}

export const TrainingWeeks: React.FC<TrainingWeeksProps> = ({
  weeks,
  exercises,
  selectedUserId,
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
  onUpdateExercise,
  onDuplicateExercise,
  onReorderWeeks,
  onReorderDays,
  onReorderBlocks,
  onReorderExercises
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = weeks.findIndex(week => week.id === active.id);
      const newIndex = weeks.findIndex(week => week.id === over?.id);
      onReorderWeeks(oldIndex, newIndex);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Εβδομάδες Προπόνησης</h3>
        <Button
          onClick={onAddWeek}
          className="bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
        >
          <Plus className="w-4 h-4 mr-2" />
          Προσθήκη Εβδομάδας
        </Button>
      </div>

      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={weeks.map(week => week.id)}
          strategy={verticalListSortingStrategy}
        >
          {weeks.map((week) => (
            <SortableWeekCard
              key={week.id}
              week={week}
              exercises={exercises}
              selectedUserId={selectedUserId}
              onRemoveWeek={() => onRemoveWeek(week.id)}
              onDuplicateWeek={() => onDuplicateWeek(week.id)}
              onUpdateWeekName={(name) => onUpdateWeekName(week.id, name)}
              onAddDay={() => onAddDay(week.id)}
              onRemoveDay={(dayId) => onRemoveDay(week.id, dayId)}
              onDuplicateDay={(dayId) => onDuplicateDay(week.id, dayId)}
              onUpdateDayName={(dayId, name) => onUpdateDayName(week.id, dayId, name)}
              onAddBlock={(dayId) => onAddBlock(week.id, dayId)}
              onRemoveBlock={(dayId, blockId) => onRemoveBlock(week.id, dayId, blockId)}
              onDuplicateBlock={(dayId, blockId) => onDuplicateBlock(week.id, dayId, blockId)}
              onUpdateBlockName={(dayId, blockId, name) => onUpdateBlockName(week.id, dayId, blockId, name)}
              onAddExercise={(dayId, blockId, exerciseId) => onAddExercise(week.id, dayId, blockId, exerciseId)}
              onRemoveExercise={(dayId, blockId, exerciseId) => onRemoveExercise(week.id, dayId, blockId, exerciseId)}
              onUpdateExercise={(dayId, blockId, exerciseId, field, value) => onUpdateExercise(week.id, dayId, blockId, exerciseId, field, value)}
              onDuplicateExercise={(dayId, blockId, exerciseId) => onDuplicateExercise(week.id, dayId, blockId, exerciseId)}
              onReorderDays={(oldIndex, newIndex) => onReorderDays(week.id, oldIndex, newIndex)}
              onReorderBlocks={(dayId, oldIndex, newIndex) => onReorderBlocks(week.id, dayId, oldIndex, newIndex)}
              onReorderExercises={(dayId, blockId, oldIndex, newIndex) => onReorderExercises(week.id, dayId, blockId, oldIndex, newIndex)}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
};
