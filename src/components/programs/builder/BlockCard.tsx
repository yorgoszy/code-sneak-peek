
import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Exercise, Block } from '../types';
import { BlockCardHeader } from './BlockCardHeader';
import { BlockCardContent } from './BlockCardContent';

interface BlockCardProps {
  block: Block;
  exercises: Exercise[];
  selectedUserId?: string;
  onAddExercise: (exerciseId: string) => void;
  onRemoveBlock: () => void;
  onDuplicateBlock: () => void;
  onUpdateBlockName: (name: string) => void;
  onUpdateExercise: (exerciseId: string, field: string, value: any) => void;
  onRemoveExercise: (exerciseId: string) => void;
  onDuplicateExercise: (exerciseId: string) => void;
  onReorderExercises: (oldIndex: number, newIndex: number) => void;
}

export const BlockCard: React.FC<BlockCardProps> = ({
  block,
  exercises,
  selectedUserId,
  onAddExercise,
  onRemoveBlock,
  onDuplicateBlock,
  onUpdateBlockName,
  onUpdateExercise,
  onRemoveExercise,
  onDuplicateExercise,
  onReorderExercises
}) => {
  const [showExerciseDialog, setShowExerciseDialog] = useState(false);

  return (
    <Card className="rounded-none mb-4 bg-gray-50">
      <BlockCardHeader
        block={block}
        onUpdateBlockName={onUpdateBlockName}
        onDuplicateBlock={onDuplicateBlock}
        onRemoveBlock={onRemoveBlock}
        onAddExercise={() => setShowExerciseDialog(true)}
      />
      
      <BlockCardContent
        block={block}
        exercises={exercises}
        selectedUserId={selectedUserId}
        showExerciseDialog={showExerciseDialog}
        onCloseExerciseDialog={() => setShowExerciseDialog(false)}
        onAddExercise={onAddExercise}
        onUpdateExercise={onUpdateExercise}
        onRemoveExercise={onRemoveExercise}
        onDuplicateExercise={onDuplicateExercise}
        onReorderExercises={onReorderExercises}
      />
    </Card>
  );
};
