
import React from 'react';
import { CardContent } from "@/components/ui/card";
import { CollapsibleContent } from "@/components/ui/collapsible";
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableBlock } from './SortableBlock';
import { Exercise, Block } from '../types';

interface DayCardContentProps {
  blocks: Block[];
  exercises: Exercise[];
  selectedUserId?: string;
  onAddExercise: (blockId: string, exerciseId: string) => void;
  onRemoveBlock: (blockId: string) => void;
  onDuplicateBlock: (blockId: string) => void;
  onUpdateBlockName: (blockId: string, name: string) => void;
  onUpdateBlockTrainingType: (blockId: string, trainingType: string) => void;
  onUpdateBlockWorkoutFormat: (blockId: string, format: string) => void;
  onUpdateBlockWorkoutDuration: (blockId: string, duration: string) => void;
  onUpdateBlockSets: (blockId: string, sets: number) => void;
  onUpdateExercise: (blockId: string, exerciseId: string, field: string, value: any) => void;
  onRemoveExercise: (blockId: string, exerciseId: string) => void;
  onDuplicateExercise: (blockId: string, exerciseId: string) => void;
  onReorderBlocks: (oldIndex: number, newIndex: number) => void;
  onReorderExercises: (blockId: string, oldIndex: number, newIndex: number) => void;
  onPasteBlock?: (blockId: string) => void;
}

export const DayCardContent: React.FC<DayCardContentProps> = ({
  blocks,
  exercises,
  selectedUserId,
  onAddExercise,
  onRemoveBlock,
  onDuplicateBlock,
  onUpdateBlockName,
  onUpdateBlockTrainingType,
  onUpdateBlockWorkoutFormat,
  onUpdateBlockWorkoutDuration,
  onUpdateBlockSets,
  onUpdateExercise,
  onRemoveExercise,
  onDuplicateExercise,
  onReorderBlocks,
  onReorderExercises,
  onPasteBlock
}) => {
  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = blocks.findIndex(block => block.id === active.id);
      const newIndex = blocks.findIndex(block => block.id === over.id);
      onReorderBlocks(oldIndex, newIndex);
    }
  };

  return (
    <CollapsibleContent>
      <CardContent className="pt-1 pb-1 pl-3 pr-1">
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-0">
              {blocks.map((block) => (
                <SortableBlock
                  key={block.id}
                  block={block}
                  exercises={exercises}
                  selectedUserId={selectedUserId}
                  onAddExercise={(exerciseId) => onAddExercise(block.id, exerciseId)}
                  onRemoveBlock={() => onRemoveBlock(block.id)}
                  onDuplicateBlock={() => onDuplicateBlock(block.id)}
                  onUpdateBlockName={(name) => onUpdateBlockName(block.id, name)}
                  onUpdateBlockTrainingType={(trainingType) => onUpdateBlockTrainingType(block.id, trainingType)}
                  onUpdateBlockWorkoutFormat={(format) => onUpdateBlockWorkoutFormat(block.id, format)}
                  onUpdateBlockWorkoutDuration={(duration) => onUpdateBlockWorkoutDuration(block.id, duration)}
                  onUpdateBlockSets={(sets) => onUpdateBlockSets(block.id, sets)}
                  onUpdateExercise={(exerciseId, field, value) => 
                    onUpdateExercise(block.id, exerciseId, field, value)
                  }
                  onRemoveExercise={(exerciseId) => onRemoveExercise(block.id, exerciseId)}
                  onDuplicateExercise={(exerciseId) => onDuplicateExercise(block.id, exerciseId)}
                  onReorderExercises={(oldIndex, newIndex) => onReorderExercises(block.id, oldIndex, newIndex)}
                  onPasteBlock={onPasteBlock ? () => onPasteBlock(block.id) : undefined}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </CardContent>
    </CollapsibleContent>
  );
};
