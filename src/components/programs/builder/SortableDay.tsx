
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from "lucide-react";
import { DayCard } from './DayCard';
import type { Day, Exercise } from '../types';

interface SortableDayProps {
  day: Day;
  exercises: Exercise[];
  selectedUserId?: string;
  onAddBlock: () => void;
  onRemoveDay: () => void;
  onDuplicateDay: () => void;
  onUpdateDayName: (name: string) => void;
  onUpdateDayTestDay: (isTestDay: boolean, testTypes: string[]) => void;
  onUpdateDayCompetitionDay: (isCompetitionDay: boolean) => void;
  onAddExercise: (blockId: string, exerciseId: string) => void;
  onRemoveBlock: (blockId: string) => void;
  onDuplicateBlock: (blockId: string) => void;
  onUpdateBlockName: (blockId: string, name: string) => void;
  onUpdateBlockTrainingType: (blockId: string, trainingType: string) => void;
  onUpdateExercise: (blockId: string, exerciseId: string, field: string, value: any) => void;
  onRemoveExercise: (blockId: string, exerciseId: string) => void;
  onDuplicateExercise: (blockId: string, exerciseId: string) => void;
  onReorderBlocks: (oldIndex: number, newIndex: number) => void;
  onReorderExercises: (blockId: string, oldIndex: number, newIndex: number) => void;
}

export const SortableDay: React.FC<SortableDayProps> = (props) => {
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
      {/* Drag Handle - Absolute positioned στην αριστερή πλευρά */}
      <div 
        {...attributes} 
        {...listeners}
        className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 cursor-grab active:cursor-grabbing bg-white rounded-none border border-gray-200 p-1 hover:bg-gray-50 transition-colors"
      >
        <GripVertical className="w-4 h-4 text-gray-400" />
      </div>
      
      {/* Day Card */}
      <DayCard {...props} />
    </div>
  );
};
