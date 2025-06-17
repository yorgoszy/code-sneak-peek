
import React from 'react';
import { CardContent } from "@/components/ui/card";
import { CollapsibleContent } from "@/components/ui/collapsible";
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableExercise } from './SortableExercise';
import { BlockLevelAttributes } from './BlockLevelAttributes';
import { Exercise, ProgramExercise, Block } from '../types';

interface BlockCardContentProps {
  block: Block;
  exercises: Exercise[];
  onUpdateExercise: (exerciseId: string, field: string, value: any) => void;
  onUpdateBlock: (field: string, value: any) => void;
  onRemoveExercise: (exerciseId: string) => void;
  onDuplicateExercise: (exerciseId: string) => void;
  onReorderExercises: (oldIndex: number, newIndex: number) => void;
}

export const BlockCardContent: React.FC<BlockCardContentProps> = ({
  block,
  exercises,
  onUpdateExercise,
  onUpdateBlock,
  onRemoveExercise,
  onDuplicateExercise,
  onReorderExercises
}) => {
  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = block.program_exercises.findIndex(exercise => exercise.id === active.id);
      const newIndex = block.program_exercises.findIndex(exercise => exercise.id === over.id);
      onReorderExercises(oldIndex, newIndex);
    }
  };

  return (
    <CollapsibleContent>
      <CardContent className="p-0 m-0">
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={block.program_exercises.map(e => e.id)} strategy={verticalListSortingStrategy}>
            <div className="w-full h-full">
              {block.program_exercises.map((exercise) => (
                <SortableExercise
                  key={exercise.id}
                  exercise={exercise}
                  exercises={exercises}
                  allBlockExercises={block.program_exercises}
                  onUpdate={(field, value) => onUpdateExercise(exercise.id, field, value)}
                  onRemove={() => onRemoveExercise(exercise.id)}
                  onDuplicate={() => onDuplicateExercise(exercise.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        
        <BlockLevelAttributes
          blockSets={block.block_sets}
          blockReps={block.block_reps}
          blockTime={block.block_time}
          blockRest={block.block_rest}
          blockTimecup={block.block_timecup}
          onUpdate={onUpdateBlock}
        />
      </CardContent>
    </CollapsibleContent>
  );
};
