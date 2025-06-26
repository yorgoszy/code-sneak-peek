
import React from 'react';
import { CardContent } from "@/components/ui/card";
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Exercise, Block } from '../types';
import { SortableExercise } from './SortableExercise';
import { ExerciseSelectionDialog } from './ExerciseSelectionDialog';

interface BlockCardContentProps {
  block: Block;
  exercises: Exercise[];
  selectedUserId?: string;
  showExerciseDialog: boolean;
  onCloseExerciseDialog: () => void;
  onAddExercise: (exerciseId: string) => void;
  onUpdateExercise: (exerciseId: string, field: string, value: any) => void;
  onRemoveExercise: (exerciseId: string) => void;
  onDuplicateExercise: (exerciseId: string) => void;
  onReorderExercises: (oldIndex: number, newIndex: number) => void;
}

export const BlockCardContent: React.FC<BlockCardContentProps> = ({
  block,
  exercises,
  selectedUserId,
  showExerciseDialog,
  onCloseExerciseDialog,
  onAddExercise,
  onUpdateExercise,
  onRemoveExercise,
  onDuplicateExercise,
  onReorderExercises
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = block.program_exercises.findIndex(ex => ex.id === active.id);
      const newIndex = block.program_exercises.findIndex(ex => ex.id === over?.id);
      onReorderExercises(oldIndex, newIndex);
    }
  };

  const handleExerciseSelect = (exerciseId: string) => {
    onAddExercise(exerciseId);
    onCloseExerciseDialog();
  };

  return (
    <>
      <CardContent className="p-0">
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={block.program_exercises.map(ex => ex.id)}
            strategy={verticalListSortingStrategy}
          >
            {block.program_exercises.map((exercise) => (
              <SortableExercise
                key={exercise.id}
                exercise={exercise}
                exercises={exercises}
                allBlockExercises={block.program_exercises}
                selectedUserId={selectedUserId}
                onUpdate={(field, value) => onUpdateExercise(exercise.id, field, value)}
                onRemove={() => onRemoveExercise(exercise.id)}
                onDuplicate={() => onDuplicateExercise(exercise.id)}
              />
            ))}
          </SortableContext>
        </DndContext>
      </CardContent>

      <ExerciseSelectionDialog
        open={showExerciseDialog}
        onOpenChange={onCloseExerciseDialog}
        exercises={exercises}
        onSelectExercise={handleExerciseSelect}
      />
    </>
  );
};
