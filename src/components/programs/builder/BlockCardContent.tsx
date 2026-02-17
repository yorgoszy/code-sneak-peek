
import React, { useCallback, useRef } from 'react';
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

  // Stable callback refs to prevent re-renders
  const onUpdateRef = useRef(onUpdateExercise);
  onUpdateRef.current = onUpdateExercise;
  const onRemoveRef = useRef(onRemoveExercise);
  onRemoveRef.current = onRemoveExercise;
  const onDuplicateRef = useRef(onDuplicateExercise);
  onDuplicateRef.current = onDuplicateExercise;

  // Memoize handlers per exercise ID to prevent re-creating on every render
  const handlersCache = useRef<Map<string, { update: (f: string, v: any) => void; remove: () => void; duplicate: () => void }>>(new Map());
  
  const getHandlers = useCallback((exerciseId: string) => {
    let handlers = handlersCache.current.get(exerciseId);
    if (!handlers) {
      handlers = {
        update: (field: string, value: any) => onUpdateRef.current(exerciseId, field, value),
        remove: () => onRemoveRef.current(exerciseId),
        duplicate: () => onDuplicateRef.current(exerciseId),
      };
      handlersCache.current.set(exerciseId, handlers);
    }
    return handlers;
  }, []);

  return (
    <CollapsibleContent>
      <CardContent className="p-0 m-0">
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={exerciseIds} strategy={verticalListSortingStrategy}>
            <div className="w-full h-full">
              {exercises.map((exercise) => {
                const h = getHandlers(exercise.id);
                return (
                  <SortableExercise
                    key={exercise.id}
                    exercise={exercise}
                    exercises={availableExercises}
                    allBlockExercises={exercises}
                    selectedUserId={selectedUserId}
                    onUpdate={h.update}
                    onRemove={h.remove}
                    onDuplicate={h.duplicate}
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      </CardContent>
    </CollapsibleContent>
  );
});

BlockCardContent.displayName = 'BlockCardContent';
