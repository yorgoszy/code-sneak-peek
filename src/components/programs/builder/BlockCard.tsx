
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Copy } from "lucide-react";
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableExercise } from './SortableExercise';
import { Exercise, Block } from '../types';

interface BlockCardProps {
  block: Block;
  exercises: Exercise[];
  allBlockExercises: Block['program_exercises'];
  selectedUserId?: string;
  onUpdateBlockName: (name: string) => void;
  onRemoveBlock: () => void;
  onDuplicateBlock: () => void;
  onAddExercise: (exerciseId: string) => void;
  onRemoveExercise: (exerciseId: string) => void;
  onUpdateExercise: (exerciseId: string, field: string, value: any) => void;
  onDuplicateExercise: (exerciseId: string) => void;
}

export const BlockCard: React.FC<BlockCardProps> = ({
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
  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      // Handle exercise reordering within block
      console.log('Reordering exercises within block:', active.id, over.id);
    }
  };

  return (
    <div className="border border-gray-200 rounded-none bg-white">
      {/* Block Header */}
      <div className="p-3 border-b bg-gray-50 flex items-center gap-2">
        <Input
          value={block.name}
          onChange={(e) => onUpdateBlockName(e.target.value)}
          className="flex-1 text-sm font-medium bg-transparent border-none p-0 h-auto focus-visible:ring-0"
          placeholder="Όνομα Block"
          style={{ borderRadius: '0px' }}
        />
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onDuplicateBlock}
            className="p-1 h-6 w-6"
            style={{ borderRadius: '0px' }}
          >
            <Copy className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemoveBlock}
            className="p-1 h-6 w-6"
            style={{ borderRadius: '0px' }}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Exercises with Drag & Drop */}
      <div className="p-3">
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={block.program_exercises?.map(e => e.id) || []} strategy={verticalListSortingStrategy}>
            {block.program_exercises?.map((exercise) => (
              <SortableExercise
                key={exercise.id}
                exercise={exercise}
                exercises={exercises}
                allBlockExercises={allBlockExercises}
                selectedUserId={selectedUserId}
                onUpdate={(field, value) => onUpdateExercise(exercise.id, field, value)}
                onRemove={() => onRemoveExercise(exercise.id)}
                onDuplicate={() => onDuplicateExercise(exercise.id)}
              />
            ))}
          </SortableContext>
        </DndContext>

        <Button
          onClick={() => onAddExercise('')}
          variant="outline"
          size="sm"
          className="w-full mt-2"
          style={{ borderRadius: '0px' }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Προσθήκη Άσκησης
        </Button>
      </div>
    </div>
  );
};
