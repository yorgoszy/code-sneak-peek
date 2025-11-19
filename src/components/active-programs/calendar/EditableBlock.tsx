
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { EditableExerciseItem } from './EditableExerciseItem';
import { ExerciseSelector } from './ExerciseSelector';

interface EditableBlockProps {
  block: any;
  onAddExercise: (blockId: string, exerciseId: string) => void;
  onRemoveBlock: (blockId: string) => void;
  onRemoveExercise: (exerciseId: string) => void;
  onUpdateExercise: (exerciseId: string, field: string, value: any) => void;
  isDragging?: boolean;
}

export const EditableBlock: React.FC<EditableBlockProps> = ({
  block,
  onAddExercise,
  onRemoveBlock,
  onRemoveExercise,
  onUpdateExercise,
  isDragging = false
}) => {
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;
    
    // Handle exercise reordering logic here if needed
    console.log('Exercise reorder:', active.id, 'to', over.id);
  };

  const handleAddExercise = (exerciseId: string) => {
    onAddExercise(block.id, exerciseId);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-gray-50 border border-gray-300 p-3 mb-2 ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            {...attributes}
            {...listeners}
            className="cursor-move p-1"
          >
            <GripVertical className="w-4 h-4 text-gray-400" />
          </div>
          <h5 className="font-medium text-sm">{block.name}</h5>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowExerciseSelector(true)}
            className="h-6 text-xs rounded-none"
          >
            <Plus className="w-3 h-3 mr-1" />
            Άσκηση
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemoveBlock(block.id)}
            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Block Info Header */}
      {(block.workout_format || block.workout_duration) && (
        <div className="mb-2">
          <div className="inline-flex items-center gap-2 text-xs border border-[#cb8954] px-2 py-1">
            {block.workout_format && <span className="text-[#cb8954]">{block.workout_format}</span>}
            {block.workout_format && block.workout_duration && <span className="text-[#cb8954]">-</span>}
            {block.workout_duration && <span className="text-[#cb8954]">{block.workout_duration}</span>}
          </div>
        </div>
      )}

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext 
          items={(block.program_exercises || []).map((ex: any) => ex.id)} 
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-1">
            {(block.program_exercises || []).map((exercise: any) => (
              <EditableExerciseItem
                key={exercise.id}
                exercise={exercise}
                onUpdate={(field, value) => onUpdateExercise(exercise.id, field, value)}
                onRemove={() => onRemoveExercise(exercise.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {(block.program_exercises || []).length === 0 && (
        <div className="text-center py-4 text-gray-500 text-sm">
          Δεν υπάρχουν ασκήσεις. Κάντε κλικ στο "Άσκηση" για να προσθέσετε.
        </div>
      )}

      <ExerciseSelector
        isOpen={showExerciseSelector}
        onClose={() => setShowExerciseSelector(false)}
        onSelectExercise={handleAddExercise}
      />
    </div>
  );
};
