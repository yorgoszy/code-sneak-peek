
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from "lucide-react";
import { DayCard } from './DayCard';
import type { Day, Exercise, EffortType } from '../types';

export interface SortableDayProps {
  day: Day;
  exercises: Exercise[];
  selectedUserId?: string;
  onAddBlock: () => void;
  onRemoveDay: () => void;
  onUpdateDayName: (name: string) => void;
  onUpdateDayTestDay: (isTestDay: boolean, testTypes: string[]) => void;
  onUpdateDayCompetitionDay: (isCompetitionDay: boolean) => void;
  onUpdateDayEsdDay: (isEsdDay: boolean) => void;
  onUpdateDayEffort: (bodyPart: 'upper' | 'lower', effort: EffortType) => void;
  onAddExercise: (blockId: string, exerciseId: string) => void;
  onRemoveBlock: (blockId: string) => void;
  onDuplicateBlock: (blockId: string) => void;
  onUpdateBlockName: (blockId: string, name: string) => void;
  onUpdateBlockTrainingType: (blockId: string, trainingType: string) => void;
  onUpdateBlockWorkoutFormat: (blockId: string, format: string) => void;
  onUpdateBlockWorkoutDuration: (blockId: string, duration: string) => void;
  onUpdateBlockSets: (blockId: string, sets: number) => void;
  onUpdateExercise: (blockId: string, exerciseId: string, field: string, value: any) => void;
  onRemoveExercise: (blockId: string, exerciseId: string) => void;
  onDuplicateExercise: (blockId: string, exerciseId: string) => void;
  onReorderBlocks: (oldIndex: number, newIndex: number) => void;
  onReorderExercises: (blockId: string, oldIndex: number, newIndex: number) => void;
  onPasteBlock?: (clipboardBlock: any) => void;
  onPasteBlockAtBlock?: (blockId: string, clipboardBlock: any) => void;
  onPasteDay?: (clipboardDay: any) => void;
  onSelectBlockTemplate?: (blockId: string, template: any) => void;
  coachId?: string;
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
    <div ref={setNodeRef} style={style} className="relative group w-[350px] flex-shrink-0">
      <DayCard {...props} dragHandleProps={{ attributes, listeners }} />
    </div>
  );
};
