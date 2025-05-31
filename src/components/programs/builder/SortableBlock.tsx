
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from "lucide-react";
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
  block_order: number;
  exercises: ProgramExercise[];
}

interface SortableBlockProps {
  block: Block;
  exercises: Exercise[];
  onAddExercise: (exerciseId: string) => void;
  onRemoveBlock: () => void;
  onDuplicateBlock: () => void;
  onUpdateBlockName: (name: string) => void;
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
    isDragging,
  } = useSortable({ id: props.block.id });

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
        <BlockCard {...props} />
      </div>
    </div>
  );
};
