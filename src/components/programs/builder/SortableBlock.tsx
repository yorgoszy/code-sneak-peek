
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BlockCard } from './BlockCard';
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
  exercises?: ProgramExercise[];
}

interface SortableBlockProps {
  block: Block;
  exercises: Exercise[];
  allBlockExercises: ProgramExercise[];
  selectedUserId?: string;
  onUpdateBlockName: (name: string) => void;
  onRemoveBlock: () => void;
  onDuplicateBlock: () => void;
  onAddExercise: (exerciseId: string) => void;
  onRemoveExercise: (exerciseId: string) => void;
  onUpdateExercise: (exerciseId: string, field: string, value: any) => void;
  onDuplicateExercise: (exerciseId: string) => void;
}

export const SortableBlock: React.FC<SortableBlockProps> = ({
  block,
  exercises,
  allBlockExercises,
  selectedUserId,
  onUpdateBlockName,
  onRemoveBlock,
  onDuplicateBlock,
  onAddExercise,
  onRemoveExercise,
  onUpdateExercise,
  onDuplicateExercise
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <BlockCard
        block={block}
        exercises={exercises}
        allBlockExercises={allBlockExercises}
        selectedUserId={selectedUserId}
        onUpdateBlockName={onUpdateBlockName}
        onRemoveBlock={onRemoveBlock}
        onDuplicateBlock={onDuplicateBlock}
        onAddExercise={onAddExercise}
        onRemoveExercise={onRemoveExercise}
        onUpdateExercise={onUpdateExercise}
        onDuplicateExercise={onDuplicateExercise}
      />
    </div>
  );
};
