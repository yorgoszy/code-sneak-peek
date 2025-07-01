
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, GripVertical } from "lucide-react";
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface EditableExerciseItemProps {
  exercise: any;
  onUpdate: (field: string, value: any) => void;
  onRemove: () => void;
  isDragging?: boolean;
}

export const EditableExerciseItem: React.FC<EditableExerciseItemProps> = ({
  exercise,
  onUpdate,
  onRemove,
  isDragging = false
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: exercise.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border border-gray-200 p-2 ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          {...attributes}
          {...listeners}
          className="cursor-move p-1"
        >
          <GripVertical className="w-4 h-4 text-gray-400" />
        </div>
        <span className="font-medium text-sm flex-1">
          {exercise.exercises?.name || 'Άγνωστη Άσκηση'}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
      
      <div className="grid grid-cols-6 gap-1 text-xs">
        <div>
          <label className="block text-gray-600 mb-1">Sets</label>
          <Input
            value={exercise.sets || ''}
            onChange={(e) => onUpdate('sets', parseInt(e.target.value) || 0)}
            className="h-6 text-xs rounded-none"
            type="number"
          />
        </div>
        <div>
          <label className="block text-gray-600 mb-1">Reps</label>
          <Input
            value={exercise.reps || ''}
            onChange={(e) => onUpdate('reps', e.target.value)}
            className="h-6 text-xs rounded-none"
          />
        </div>
        <div>
          <label className="block text-gray-600 mb-1">Kg</label>
          <Input
            value={exercise.kg || ''}
            onChange={(e) => onUpdate('kg', e.target.value)}
            className="h-6 text-xs rounded-none"
          />
        </div>
        <div>
          <label className="block text-gray-600 mb-1">%1RM</label>
          <Input
            value={exercise.percentage_1rm || ''}
            onChange={(e) => onUpdate('percentage_1rm', parseInt(e.target.value) || 0)}
            className="h-6 text-xs rounded-none"
            type="number"
          />
        </div>
        <div>
          <label className="block text-gray-600 mb-1">Tempo</label>
          <Input
            value={exercise.tempo || ''}
            onChange={(e) => onUpdate('tempo', e.target.value)}
            className="h-6 text-xs rounded-none"
          />
        </div>
        <div>
          <label className="block text-gray-600 mb-1">Rest</label>
          <Input
            value={exercise.rest || ''}
            onChange={(e) => onUpdate('rest', e.target.value)}
            className="h-6 text-xs rounded-none"
          />
        </div>
      </div>
      
      {exercise.notes && (
        <div className="mt-2">
          <label className="block text-gray-600 mb-1 text-xs">Notes</label>
          <Input
            value={exercise.notes || ''}
            onChange={(e) => onUpdate('notes', e.target.value)}
            className="h-6 text-xs rounded-none"
          />
        </div>
      )}
    </div>
  );
};
