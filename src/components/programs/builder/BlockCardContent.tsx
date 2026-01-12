
import React, { useCallback } from 'react';
import { CardContent } from "@/components/ui/card";
import { CollapsibleContent } from "@/components/ui/collapsible";
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableExercise } from './SortableExercise';
import { Exercise, ProgramExercise } from '../types';

interface BlockCardContentProps {
  exercises: ProgramExercise[];
  availableExercises: Exercise[];
  selectedUserId?: string;
  onUpdateExercise: (exerciseId: string, field: string, value: any) => void;
  onRemoveExercise: (exerciseId: string) => void;
  onDuplicateExercise: (exerciseId: string) => void;
  onReorderExercises: (oldIndex: number, newIndex: number) => void;
}

export const BlockCardContent: React.FC<BlockCardContentProps> = React.memo(({
  exercises,
  availableExercises,
  selectedUserId,
  onUpdateExercise,
  onRemoveExercise,
  onDuplicateExercise,
  onReorderExercises
}) => {
  const handleDragEnd = useCallback((event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = exercises.findIndex(exercise => exercise.id === active.id);
      const newIndex = exercises.findIndex(exercise => exercise.id === over.id);
      onReorderExercises(oldIndex, newIndex);
    }
  }, [exercises, onReorderExercises]);

  // Memoize exercise item ids for SortableContext
  const exerciseIds = React.useMemo(() => exercises.map(e => e.id), [exercises]);

  return (
    <CollapsibleContent>
      <CardContent className="p-0 m-0">
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={exerciseIds} strategy={verticalListSortingStrategy}>
            <div className="w-full h-full">
              {exercises.map((exercise) => (
                <SortableExercise
                  key={exercise.id}
                  exercise={exercise}
                  exercises={availableExercises}
                  allBlockExercises={exercises}
                  selectedUserId={selectedUserId}
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
});

BlockCardContent.displayName = 'BlockCardContent';
