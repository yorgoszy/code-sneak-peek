
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BlockCard } from './BlockCard';
import { Exercise, Block } from '../types';

interface SortableBlockProps {
  block: Block;
  exercises: Exercise[];
  onAddExercise: (exerciseId: string) => void;
  onRemoveBlock: () => void;
  onDuplicateBlock: () => void;
  onUpdateBlockName: (name: string) => void;
  onUpdateBlock: (field: string, value: any) => void;
  onUpdateExercise: (exerciseId: string, field: string, value: any) => void;
  onRemoveExercise: (exerciseId: string) => void;
  onDuplicateExercise: (exerciseId: string) => void;
  onReorderExercises: (oldIndex: number, newIndex: number) => void;
}

export const SortableBlock: React.FC<SortableBlockProps> = (props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: props.block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <BlockCard {...props} />
    </div>
  );
};
