
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
import { Exercise, Day } from '../types';
import { SortableBlock } from './SortableBlock';
import { DayCalculations } from './DayCalculations';

interface DayCardContentProps {
  day: Day;
  exercises: Exercise[];
  selectedUserId?: string;
  onAddBlock: () => void;
  onRemoveBlock: (blockId: string) => void;
  onDuplicateBlock: (blockId: string) => void;
  onUpdateBlockName: (blockId: string, name: string) => void;
  onAddExercise: (blockId: string, exerciseId: string) => void;
  onUpdateExercise: (blockId: string, exerciseId: string, field: string, value: any) => void;
  onRemoveExercise: (blockId: string, exerciseId: string) => void;
  onDuplicateExercise: (blockId: string, exerciseId: string) => void;
  onReorderBlocks: (oldIndex: number, newIndex: number) => void;
  onReorderExercises: (blockId: string, oldIndex: number, newIndex: number) => void;
}

export const DayCardContent: React.FC<DayCardContentProps> = ({
  day,
  exercises,
  selectedUserId,
  onAddBlock,
  onRemoveBlock,
  onDuplicateBlock,
  onUpdateBlockName,
  onAddExercise,
  onUpdateExercise,
  onRemoveExercise,
  onDuplicateExercise,
  onReorderBlocks,
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
      const oldIndex = day.program_blocks.findIndex(block => block.id === active.id);
      const newIndex = day.program_blocks.findIndex(block => block.id === over?.id);
      onReorderBlocks(oldIndex, newIndex);
    }
  };

  return (
    <CardContent className="p-4">
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={day.program_blocks.map(block => block.id)}
          strategy={verticalListSortingStrategy}
        >
          {day.program_blocks.map((block) => (
            <SortableBlock
              key={block.id}
              block={block}
              exercises={exercises}
              selectedUserId={selectedUserId}
              onAddExercise={(exerciseId) => onAddExercise(block.id, exerciseId)}
              onRemoveBlock={() => onRemoveBlock(block.id)}
              onDuplicateBlock={() => onDuplicateBlock(block.id)}
              onUpdateBlockName={(name) => onUpdateBlockName(block.id, name)}
              onUpdateExercise={(exerciseId, field, value) => onUpdateExercise(block.id, exerciseId, field, value)}
              onRemoveExercise={(exerciseId) => onRemoveExercise(block.id, exerciseId)}
              onDuplicateExercise={(exerciseId) => onDuplicateExercise(block.id, exerciseId)}
              onReorderExercises={(oldIndex, newIndex) => onReorderExercises(block.id, oldIndex, newIndex)}
            />
          ))}
        </SortableContext>
      </DndContext>

      <DayCalculations blocks={day.program_blocks} exercises={exercises} />
    </CardContent>
  );
};
