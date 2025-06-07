
import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Collapsible } from "@/components/ui/collapsible";
import { GripVertical } from "lucide-react";
import { DayCardHeader } from './DayCardHeader';
import { DayCardContent } from './DayCardContent';
import { DayCalculations } from './DayCalculations';
import { Exercise, Day, Block, ProgramExercise } from '../types';

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
  onUpdateExercise,
  onRemoveExercise,
  onDuplicateExercise,
  onReorderBlocks,
  onReorderExercises
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingName, setEditingName] = useState(day.name);

  const handleNameDoubleClick = () => {
    setIsEditing(true);
    setEditingName(day.name);
  };

  const handleNameSave = () => {
    if (editingName.trim()) {
      onUpdateDayName(editingName.trim());
    }
    setIsEditing(false);
  };

  const handleNameKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditingName(day.name);
    }
  };

  const blocksCount = day.program_blocks.length;

  return (
    <Card className="rounded-none relative" style={{ minHeight: '30px' }}>
      <div className="absolute left-0 top-0 bottom-0 w-4 flex items-center justify-center cursor-move z-10">
        <GripVertical className="w-3 h-3 text-gray-400" />
      </div>
      
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <DayCardHeader
          dayName={day.name}
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
        
        {isOpen && (
          <DayCardContent
            blocks={day.program_blocks}
            exercises={exercises}
            onAddExercise={onAddExercise}
            onRemoveBlock={onRemoveBlock}
            onDuplicateBlock={onDuplicateBlock}
            onUpdateBlockName={onUpdateBlockName}
            onUpdateExercise={onUpdateExercise}
            onRemoveExercise={onRemoveExercise}
            onDuplicateExercise={onDuplicateExercise}
            onReorderBlocks={onReorderBlocks}
            onReorderExercises={onReorderExercises}
          />
        )}
        
        <DayCalculations 
          blocks={day.program_blocks} 
          exercises={exercises} 
        />
      </Collapsible>
    </Card>
  );
};
