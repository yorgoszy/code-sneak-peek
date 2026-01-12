
import React, { useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { DebouncedInput } from '@/components/programs/builder/DebouncedInput';
import { Trash2, GripVertical } from "lucide-react";
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface EditableExerciseItemProps {
  exercise: any;
  onUpdate: (field: string, value: any) => void;
  onRemove: () => void;
  isDragging?: boolean;
}

export const EditableExerciseItem: React.FC<EditableExerciseItemProps> = React.memo(({
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

  const velocityDisplay = typeof exercise.velocity_ms === 'number'
    ? exercise.velocity_ms.toString().replace('.', ',')
    : (exercise.velocity_ms || '');

  // Memoized handlers
  const handleSetsChange = useCallback((value: string) => {
    onUpdate('sets', parseInt(value) || 0);
  }, [onUpdate]);

  const handleRepsChange = useCallback((value: string) => {
    onUpdate('reps', value);
  }, [onUpdate]);

  const handleKgChange = useCallback((value: string) => {
    onUpdate('kg', value);
  }, [onUpdate]);

  const handleVelocityChange = useCallback((value: string) => {
    const cleaned = value.replace('.', ',');
    onUpdate('velocity_ms', cleaned);
  }, [onUpdate]);

  const handlePercentageChange = useCallback((value: string) => {
    onUpdate('percentage_1rm', parseInt(value) || 0);
  }, [onUpdate]);

  const handleTempoChange = useCallback((value: string) => {
    onUpdate('tempo', value);
  }, [onUpdate]);

  const handleRestChange = useCallback((value: string) => {
    onUpdate('rest', value);
  }, [onUpdate]);

  const handleNotesChange = useCallback((value: string) => {
    onUpdate('notes', value);
  }, [onUpdate]);

  const inputClassName = "h-5 sm:h-6 rounded-none px-1 sm:px-2 text-[9px] sm:text-[10px]";
  const inputStyle = { appearance: 'textfield' as const };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border border-gray-200 p-1.5 sm:p-2 ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center gap-1 sm:gap-2 mb-1.5 sm:mb-2">
        <div
          {...attributes}
          {...listeners}
          className="cursor-move p-0.5 sm:p-1"
        >
          <GripVertical className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
        </div>
        <span className="font-medium text-xs sm:text-sm flex-1 truncate">
          {exercise.exercises?.name || 'Άγνωστη Άσκηση'}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="h-5 w-5 sm:h-6 sm:w-6 p-0 text-red-500 hover:text-red-700"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
      
      {/* Mobile: 2 rows of inputs, Desktop: single row */}
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-0.5 sm:gap-0" style={{ fontSize: '10px' }}>
        <div className="flex-1">
          <label className="block text-gray-600 mb-0.5 sm:mb-1 text-[8px] sm:text-[9px]">Sets</label>
          <DebouncedInput
            value={exercise.sets || ''}
            onChange={handleSetsChange}
            className={`${inputClassName} border-r-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
            style={inputStyle}
            type="number"
            min={0}
          />
        </div>
        <div className="flex-1">
          <label className="block text-gray-600 mb-0.5 sm:mb-1 text-[8px] sm:text-[9px]">Reps</label>
          <DebouncedInput
            value={exercise.reps || ''}
            onChange={handleRepsChange}
            className={`${inputClassName} border-r-0`}
          />
        </div>
        <div className="flex-1">
          <label className="block text-gray-600 mb-0.5 sm:mb-1 text-[8px] sm:text-[9px]">Kg</label>
          <DebouncedInput
            value={exercise.kg || ''}
            onChange={handleKgChange}
            className={`${inputClassName} border-r-0`}
          />
        </div>
        <div className="flex-1">
          <label className="block text-gray-600 mb-0.5 sm:mb-1 text-[8px] sm:text-[9px]">m/s</label>
          <DebouncedInput
            value={velocityDisplay}
            onChange={handleVelocityChange}
            className={`${inputClassName} sm:border-r-0`}
          />
        </div>
        <div className="flex-1">
          <label className="block text-gray-600 mb-0.5 sm:mb-1 text-[8px] sm:text-[9px]">%1RM</label>
          <DebouncedInput
            value={exercise.percentage_1rm || ''}
            onChange={handlePercentageChange}
            className={`${inputClassName} border-r-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
            style={inputStyle}
            type="number"
            min={0}
            max={100}
          />
        </div>
        <div className="flex-1">
          <label className="block text-gray-600 mb-0.5 sm:mb-1 text-[8px] sm:text-[9px]">Tempo</label>
          <DebouncedInput
            value={exercise.tempo || ''}
            onChange={handleTempoChange}
            className={`${inputClassName} border-r-0`}
          />
        </div>
        <div className="flex-1">
          <label className="block text-gray-600 mb-0.5 sm:mb-1 text-[8px] sm:text-[9px]">Rest</label>
          <DebouncedInput
            value={exercise.rest || ''}
            onChange={handleRestChange}
            className={inputClassName}
          />
        </div>
      </div>
      
      {exercise.notes && (
        <div className="mt-1.5 sm:mt-2">
          <label className="block text-gray-600 mb-0.5 sm:mb-1 text-[8px] sm:text-[9px]">Notes</label>
          <DebouncedInput
            value={exercise.notes || ''}
            onChange={handleNotesChange}
            className={inputClassName}
          />
        </div>
      )}
    </div>
  );
});

EditableExerciseItem.displayName = 'EditableExerciseItem';
