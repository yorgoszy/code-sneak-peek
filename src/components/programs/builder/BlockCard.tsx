
import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Collapsible } from "@/components/ui/collapsible";
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
  const [isOpen, setIsOpen] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingName, setEditingName] = useState(block.name);

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

  return (
    <Card className="rounded-none mb-4 bg-gray-50">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <BlockCardHeader
          block={block}
          isOpen={isOpen}
          isEditing={isEditing}
          editingName={editingName}
          onNameDoubleClick={handleNameDoubleClick}
          onEditingNameChange={setEditingName}
          onNameSave={handleNameSave}
          onNameKeyPress={handleNameKeyPress}
          onUpdateBlockName={onUpdateBlockName}
          onAddExercise={() => setShowExerciseDialog(true)}
          onDuplicateBlock={onDuplicateBlock}
          onRemoveBlock={onRemoveBlock}
        />
        
        {isOpen && (
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
        )}
      </Collapsible>
    </Card>
  );
};
