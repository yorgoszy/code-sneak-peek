
import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Collapsible } from "@/components/ui/collapsible";
import { BlockCardHeader } from './BlockCardHeader';
import { BlockCardContent } from './BlockCardContent';
import { ExerciseSelectionDialog } from './ExerciseSelectionDialog';
import { Exercise, Block } from '../types';

// Μόνιμα blocks που δεν μπορούν να διαγραφούν
const PERMANENT_BLOCKS = ['mobility', 'stability', 'activation', 'neural act', 'recovery'];

interface BlockCardProps {
  block: Block;
  exercises: Exercise[];
  onAddExercise: (exerciseId: string) => void;
  onRemoveBlock: () => void;
  onDuplicateBlock: () => void;
  onUpdateBlockName: (name: string) => void;
  onUpdateBlockTrainingType: (trainingType: string) => void;
  onUpdateExercise: (exerciseId: string, field: string, value: any) => void;
  onRemoveExercise: (exerciseId: string) => void;
  onDuplicateExercise: (exerciseId: string) => void;
  onReorderExercises: (oldIndex: number, newIndex: number) => void;
}

export const BlockCard: React.FC<BlockCardProps> = ({
  block,
  exercises,
  onAddExercise,
  onRemoveBlock,
  onDuplicateBlock,
  onUpdateBlockName,
  onUpdateBlockTrainingType,
  onUpdateExercise,
  onRemoveExercise,
  onDuplicateExercise,
  onReorderExercises
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingName, setEditingName] = useState(block.name);
  const [showExerciseDialog, setShowExerciseDialog] = useState(false);

  const handleNameDoubleClick = () => {
    setIsEditing(true);
    setEditingName(block.name);
  };

  const handleNameSave = () => {
    if (editingName.trim()) {
      onUpdateBlockName(editingName.trim());
    }
    setIsEditing(false);
  };

  const handleNameKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditingName(block.name);
    }
  };

  const handleAddExerciseClick = () => {
    setShowExerciseDialog(true);
  };

  const handleExerciseSelect = (exerciseId: string) => {
    onAddExercise(exerciseId);
    setShowExerciseDialog(false);
  };

  const exercisesCount = block.program_exercises.length;
  const isPermanentBlock = PERMANENT_BLOCKS.includes(block.training_type || '');

  return (
    <>
      <Card className={`rounded-none w-full transition-all duration-200 ${isOpen ? 'min-h-[120px]' : 'min-h-[40px]'}`} style={{ backgroundColor: '#31365d' }}>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <BlockCardHeader
            blockName={block.name}
            trainingType={block.training_type}
            isOpen={isOpen}
            isEditing={isEditing}
            editingName={editingName}
            exercisesCount={exercisesCount}
            onNameDoubleClick={handleNameDoubleClick}
            onEditingNameChange={setEditingName}
            onNameSave={handleNameSave}
            onNameKeyPress={handleNameKeyPress}
            onAddExercise={handleAddExerciseClick}
            onDuplicateBlock={isPermanentBlock ? () => {} : onDuplicateBlock}
            onRemoveBlock={isPermanentBlock ? () => {} : onRemoveBlock}
            onTrainingTypeChange={onUpdateBlockTrainingType}
            isPermanent={isPermanentBlock}
          />
          
          <BlockCardContent
            exercises={block.program_exercises}
            availableExercises={exercises}
            onUpdateExercise={onUpdateExercise}
            onRemoveExercise={onRemoveExercise}
            onDuplicateExercise={onDuplicateExercise}
            onReorderExercises={onReorderExercises}
          />
        </Collapsible>
      </Card>

      <ExerciseSelectionDialog
        open={showExerciseDialog}
        onOpenChange={setShowExerciseDialog}
        exercises={exercises}
        onSelectExercise={handleExerciseSelect}
      />
    </>
  );
};
