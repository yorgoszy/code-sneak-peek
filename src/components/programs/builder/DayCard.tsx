
import React, { useState } from 'react';
import { Card, CardHeader } from "@/components/ui/card";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { DayCardHeader } from './DayCardHeader';
import { DayCardContent } from './DayCardContent';
import { Exercise, Day } from '../types';

interface DayCardProps {
  day: Day;
  exercises: Exercise[];
  onAddBlock: () => void;
  onRemoveDay: () => void;
  onDuplicateDay: () => void;
  onUpdateDayName: (name: string) => void;
  onAddExercise: (blockId: string, exerciseId: string) => void;
  onRemoveBlock: (blockId: string) => void;
  onDuplicateBlock: (blockId: string) => void;
  onUpdateBlockName: (blockId: string, name: string) => void;
  onUpdateBlock: (blockId: string, field: string, value: any) => void;
  onUpdateExercise: (blockId: string, exerciseId: string, field: string, value: any) => void;
  onRemoveExercise: (blockId: string, exerciseId: string) => void;
  onDuplicateExercise: (blockId: string, exerciseId: string) => void;
  onReorderBlocks: (oldIndex: number, newIndex: number) => void;
  onReorderExercises: (blockId: string, oldIndex: number, newIndex: number) => void;
}

export const DayCard: React.FC<DayCardProps> = ({
  day,
  exercises,
  onAddBlock,
  onRemoveDay,
  onDuplicateDay,
  onUpdateDayName,
  onAddExercise,
  onRemoveBlock,
  onDuplicateBlock,
  onUpdateBlockName,
  onUpdateBlock,
  onUpdateExercise,
  onRemoveExercise,
  onDuplicateExercise,
  onReorderBlocks,
  onReorderExercises
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingName, setEditingName] = useState(day.name || '');

  const handleNameDoubleClick = () => {
    setIsEditing(true);
    setEditingName(day.name || '');
  };

  const handleNameSave = () => {
    if (editingName.trim() && editingName !== day.name) {
      onUpdateDayName(editingName.trim());
    }
    setIsEditing(false);
  };

  const handleNameKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditingName(day.name || '');
    }
  };

  const blocksCount = day.program_blocks?.length || 0;

  return (
    <Card className="rounded-none">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <DayCardHeader
          dayName={day.name || `Ημέρα ${day.day_number}`}
          isOpen={isOpen}
          isEditing={isEditing}
          editingName={editingName}
          blocksCount={blocksCount}
          onNameDoubleClick={handleNameDoubleClick}
          onEditingNameChange={setEditingName}
          onNameSave={handleNameSave}
          onNameKeyPress={handleNameKeyPress}
          onAddBlock={onAddBlock}
          onDuplicateDay={onDuplicateDay}
          onRemoveDay={onRemoveDay}
        />
        
        <CollapsibleContent>
          <DayCardContent
            blocks={day.program_blocks || []}
            exercises={exercises}
            onAddExercise={onAddExercise}
            onRemoveBlock={onRemoveBlock}
            onDuplicateBlock={onDuplicateBlock}
            onUpdateBlockName={onUpdateBlockName}
            onUpdateBlock={onUpdateBlock}
            onUpdateExercise={onUpdateExercise}
            onRemoveExercise={onRemoveExercise}
            onDuplicateExercise={onDuplicateExercise}
            onReorderBlocks={onReorderBlocks}
            onReorderExercises={onReorderExercises}
          />
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
