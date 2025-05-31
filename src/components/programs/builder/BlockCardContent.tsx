
import React from 'react';
import { CardContent } from "@/components/ui/card";
import { CollapsibleContent } from "@/components/ui/collapsible";
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableExercise } from './SortableExercise';
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

interface BlockCardContentProps {
  exercises: ProgramExercise[];
  availableExercises: Exercise[];
  onUpdateExercise: (exerciseId: string, field: string, value: any) => void;
  onRemoveExercise: (exerciseId: string) => void;
  onDuplicateExercise: (exerciseId: string) => void;
  onReorderExercises: (oldIndex: number, newIndex: number) => void;
}

export const BlockCardContent: React.FC<BlockCardContentProps> = ({
  exercises,
  availableExercises,
  onUpdateExercise,
  onRemoveExercise,
  onDuplicateExercise,
  onReorderExercises
}) => {
  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = exercises.findIndex(exercise => exercise.id === active.id);
      const newIndex = exercises.findIndex(exercise => exercise.id === over.id);
      onReorderExercises(oldIndex, newIndex);
    }
  };

  return (
    <CollapsibleContent>
      <CardContent className="pt-2 pl-4">
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={exercises.map(e => e.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-0">
              {exercises.map((exercise) => (
                <SortableExercise
                  key={exercise.id}
                  exercise={exercise}
                  exercises={availableExercises}
                  onUpdate={(field, value) => onUpdateExercise(exercise.id, field, value)}
                  onRemove={() => onRemoveExercise(exercise.id)}
                  onDuplicate={() => onDuplicateExercise(exercise.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </CardContent>
    </CollapsibleContent>
  );
};
