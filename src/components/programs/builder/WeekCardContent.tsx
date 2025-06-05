
import React from 'react';
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { DayCard } from './DayCard';
import type { WeekStructure } from './hooks/useProgramBuilderState';
import type { Exercise } from '../types';

interface WeekCardContentProps {
  week: WeekStructure;
  exercises: Exercise[];
  onAddDay: () => void;
  onRemoveDay: (dayId: string) => void;
  onDuplicateDay: (dayId: string) => void;
  onUpdateDayName: (dayId: string, name: string) => void;
  onAddBlock: (dayId: string) => void;
  onRemoveBlock: (dayId: string, blockId: string) => void;
  onDuplicateBlock: (dayId: string, blockId: string) => void;
  onUpdateBlockName: (dayId: string, blockId: string, name: string) => void;
  onAddExercise: (dayId: string, blockId: string, exerciseId: string) => void;
  onRemoveExercise: (dayId: string, blockId: string, exerciseId: string) => void;
  onUpdateExercise: (dayId: string, blockId: string, exerciseId: string, field: string, value: any) => void;
  onDuplicateExercise: (dayId: string, blockId: string, exerciseId: string) => void;
  onReorderDays: (oldIndex: number, newIndex: number) => void;
  onReorderBlocks: (dayId: string, oldIndex: number, newIndex: number) => void;
  onReorderExercises: (dayId: string, blockId: string, oldIndex: number, newIndex: number) => void;
}

export const WeekCardContent: React.FC<WeekCardContentProps> = ({
  week,
  exercises,
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
  onReorderDays,
  onReorderBlocks,
  onReorderExercises
}) => {
  return (
    <div className="space-y-4">
      {/* Days */}
      <div className="grid gap-4">
        {week.days?.map((day, dayIndex) => (
          <DayCard
            key={day.id}
            day={day}
            weekId={week.id}
            exercises={exercises}
            onUpdateDayName={(dayId, name) => onUpdateDayName(dayId, name)}
            onRemoveDay={(dayId) => onRemoveDay(dayId)}
            onDuplicateDay={(dayId) => onDuplicateDay(dayId)}
            onAddBlock={() => onAddBlock(day.id)}
            onRemoveBlock={(blockId) => onRemoveBlock(day.id, blockId)}
            onDuplicateBlock={(blockId) => onDuplicateBlock(day.id, blockId)}
            onUpdateBlockName={(blockId, name) => onUpdateBlockName(day.id, blockId, name)}
            onAddExercise={(blockId, exerciseId) => onAddExercise(day.id, blockId, exerciseId)}
            onRemoveExercise={(exerciseId) => onRemoveExercise(day.id, '', exerciseId)}
            onUpdateExercise={(exerciseId, field, value) => onUpdateExercise(day.id, '', exerciseId, field, value)}
            onDuplicateExercise={(exerciseId) => onDuplicateExercise(day.id, '', exerciseId)}
            onReorderBlocks={(oldIndex, newIndex) => onReorderBlocks(day.id, oldIndex, newIndex)}
            onReorderExercises={(blockId, oldIndex, newIndex) => onReorderExercises(day.id, blockId, oldIndex, newIndex)}
          />
        ))}
      </div>

      {/* Add Day Button */}
      <Button
        onClick={onAddDay}
        variant="outline"
        className="w-full rounded-none"
      >
        <Plus className="w-4 h-4 mr-2" />
        Προσθήκη Ημέρας
      </Button>
    </div>
  );
};
