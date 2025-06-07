
import React from 'react';
import { CardContent } from "@/components/ui/card";
import { CollapsibleContent } from "@/components/ui/collapsible";
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableBlock } from './SortableBlock';
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

interface Block {
  id: string;
  name: string;
  block_order: number;
  exercises: ProgramExercise[];
}

interface DayCardContentProps {
  blocks: Block[];
  exercises: Exercise[];
  onAddExercise: (blockId: string, exerciseId: string) => void;
  onRemoveBlock: (blockId: string) => void;
  onDuplicateBlock: (blockId: string) => void;
  onUpdateBlockName: (blockId: string, name: string) => void;
  onUpdateExercise: (blockId: string, exerciseId: string, field: string, value: any) => void;
  onRemoveExercise: (blockId: string, exerciseId: string) => void;
  onDuplicateExercise: (blockId: string, exerciseId: string) => void;
  onReorderBlocks: (oldIndex: number, newIndex: number) => void;
  onReorderExercises: (blockId: string, oldIndex: number, newIndex: number) => void;
}

export const DayCardContent: React.FC<DayCardContentProps> = ({
  blocks,
  exercises,
  onAddExercise,
  onRemoveBlock,
  onDuplicateBlock,
  onUpdateBlockName,
  onUpdateExercise,
  onRemoveExercise,
  onDuplicateExercise,
  onReorderBlocks,
  onReorderExercises
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
      <CardContent className="pt-2 pl-4">
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-0">
              {blocks.map((block) => (
                <SortableBlock
                  key={block.id}
                  block={block}
                  exercises={exercises}
                  onAddExercise={(exerciseId) => onAddExercise(block.id, exerciseId)}
                  onRemoveBlock={() => onRemoveBlock(block.id)}
                  onDuplicateBlock={() => onDuplicateBlock(block.id)}
                  onUpdateBlockName={(name) => onUpdateBlockName(block.id, name)}
                  onUpdateExercise={(exerciseId, field, value) => 
                    onUpdateExercise(block.id, exerciseId, field, value)
                  }
                  onRemoveExercise={(exerciseId) => onRemoveExercise(block.id, exerciseId)}
                  onDuplicateExercise={(exerciseId) => onDuplicateExercise(block.id, exerciseId)}
                  onReorderExercises={(oldIndex, newIndex) => onReorderExercises(block.id, oldIndex, newIndex)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </CardContent>
    </CollapsibleContent>
  );
};
