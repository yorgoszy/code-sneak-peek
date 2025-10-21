
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useExerciseInputHandlers } from '@/components/programs/builder/hooks/useExerciseInputHandlers';
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

  const { handleVelocityChange } = useExerciseInputHandlers({ onUpdate });
  const velocityDisplay = typeof exercise.velocity_ms === 'number'
    ? exercise.velocity_ms.toString().replace('.', ',')
    : (exercise.velocity_ms || '');

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
      
      <div className="grid grid-cols-7 gap-0" style={{ fontSize: '10px' }}>
        <div className="flex-1">
          <label className="block text-gray-600 mb-1" style={{ fontSize: '9px' }}>Sets</label>
          <Input
            value={exercise.sets || ''}
            onChange={(e) => onUpdate('sets', parseInt(e.target.value) || 0)}
            className="h-6 rounded-none border-r-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none px-2"
            style={{ appearance: 'textfield', fontSize: '10px' }}
            type="number"
            min="0"
          />
        </div>
        <div className="flex-1">
          <label className="block text-gray-600 mb-1" style={{ fontSize: '9px' }}>Reps</label>
          <Input
            value={exercise.reps || ''}
            onChange={(e) => onUpdate('reps', e.target.value)}
            className="h-6 rounded-none border-r-0 px-2"
            style={{ fontSize: '10px' }}
          />
        </div>
        <div className="flex-1">
          <label className="block text-gray-600 mb-1" style={{ fontSize: '9px' }}>Kg</label>
          <Input
            value={exercise.kg || ''}
            onChange={(e) => onUpdate('kg', e.target.value)}
            className="h-6 rounded-none border-r-0 px-2"
            style={{ fontSize: '10px' }}
          />
        </div>
        <div className="flex-1">
          <label className="block text-gray-600 mb-1" style={{ fontSize: '9px' }}>m/s</label>
          <Input
            value={velocityDisplay}
            onChange={handleVelocityChange}
            className="h-6 rounded-none border-r-0 px-2"
            style={{ fontSize: '10px' }}
          />
        </div>
        <div className="flex-1">
          <label className="block text-gray-600 mb-1" style={{ fontSize: '9px' }}>%1RM</label>
          <Input
            value={exercise.percentage_1rm || ''}
            onChange={(e) => onUpdate('percentage_1rm', parseInt(e.target.value) || 0)}
            className="h-6 rounded-none border-r-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none px-2"
            style={{ appearance: 'textfield', fontSize: '10px' }}
            type="number"
            min="0"
            max="100"
          />
        </div>
        <div className="flex-1">
          <label className="block text-gray-600 mb-1" style={{ fontSize: '9px' }}>Tempo</label>
          <Input
            value={exercise.tempo || ''}
            onChange={(e) => onUpdate('tempo', e.target.value)}
            className="h-6 rounded-none border-r-0 px-2"
            style={{ fontSize: '10px' }}
          />
        </div>
        <div className="flex-1">
          <label className="block text-gray-600 mb-1" style={{ fontSize: '9px' }}>Rest</label>
          <Input
            value={exercise.rest || ''}
            onChange={(e) => onUpdate('rest', e.target.value)}
            className="h-6 rounded-none px-2"
            style={{ fontSize: '10px' }}
          />
        </div>
      </div>
      
      {exercise.notes && (
        <div className="mt-2">
          <label className="block text-gray-600 mb-1" style={{ fontSize: '9px' }}>Notes</label>
          <Input
            value={exercise.notes || ''}
            onChange={(e) => onUpdate('notes', e.target.value)}
            className="h-6 rounded-none px-2"
            style={{ fontSize: '10px' }}
          />
        </div>
      )}
    </div>
  );
};
