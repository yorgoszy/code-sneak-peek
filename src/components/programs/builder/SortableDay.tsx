
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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

interface SortableDayProps {
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
}

export const SortableDay: React.FC<SortableDayProps> = ({
  day,
  exercises,
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
  onReorderBlocks,
  onReorderExercises
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: day.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <DayCard
        day={day}
        exercises={exercises}
        onAddBlock={onAddBlock}
        onRemoveDay={onRemoveDay}
        onDuplicateDay={onDuplicateDay}
        onUpdateDayName={onUpdateDayName}
        onAddExercise={onAddExercise}
        onRemoveBlock={onRemoveBlock}
        onDuplicateBlock={onDuplicateBlock}
        onUpdateBlockName={onUpdateBlockName}
        onUpdateExercise={onUpdateExercise}
        onRemoveExercise={onRemoveExercise}
        onDuplicateExercise={onDuplicateExercise}
        onReorderBlocks={onReorderBlocks}
        onReorderExercises={onReorderExercises}
        dragHandle={listeners}
      />
    </div>
  );
};
