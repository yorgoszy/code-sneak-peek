
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from "lucide-react";
import { WeekCard } from './WeekCard';
import { Exercise, Week } from '../types';

interface SortableWeekCardProps {
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

export const SortableWeekCard: React.FC<SortableWeekCardProps> = (props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.week.id });

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
      <WeekCard {...props} />
    </div>
  );
};
