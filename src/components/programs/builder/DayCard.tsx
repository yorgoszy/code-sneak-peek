
import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Collapsible } from "@/components/ui/collapsible";
import { GripVertical } from "lucide-react";
import { DayCardHeader } from './DayCardHeader';
import { DayCardContent } from './DayCardContent';
import { DayCalculations } from './DayCalculations';
import { TestDaySelector } from './TestDaySelector';
import { CompetitionDaySelector } from './CompetitionDaySelector';
import { Exercise, Day } from '../types';

interface DayCardProps {
  day: Day;
  exercises: Exercise[];
  selectedUserId?: string;
  onAddBlock: () => void;
  onRemoveDay: () => void;
  onDuplicateDay: () => void;
  onUpdateDayName: (name: string) => void;
  onUpdateDayTestDay: (isTestDay: boolean, testTypes: string[]) => void;
  onUpdateDayCompetitionDay: (isCompetitionDay: boolean) => void;
  onAddExercise: (blockId: string, exerciseId: string) => void;
  onRemoveBlock: (blockId: string) => void;
  onDuplicateBlock: (blockId: string) => void;
  onUpdateBlockName: (blockId: string, name: string) => void;
  onUpdateBlockTrainingType: (blockId: string, trainingType: string) => void;
  onUpdateExercise: (blockId: string, exerciseId: string, field: string, value: any) => void;
  onRemoveExercise: (blockId: string, exerciseId: string) => void;
  onDuplicateExercise: (blockId: string, exerciseId: string) => void;
  onReorderBlocks: (oldIndex: number, newIndex: number) => void;
  onReorderExercises: (blockId: string, oldIndex: number, newIndex: number) => void;
  dragHandleProps?: {
    attributes: any;
    listeners: any;
  };
}

export const DayCard: React.FC<DayCardProps> = ({
  day,
  exercises,
  selectedUserId,
  onAddBlock,
  onRemoveDay,
  onDuplicateDay,
  onUpdateDayName,
  onUpdateDayTestDay,
  onUpdateDayCompetitionDay,
  onAddExercise,
  onRemoveBlock,
  onDuplicateBlock,
  onUpdateBlockName,
  onUpdateBlockTrainingType,
  onUpdateExercise,
  onRemoveExercise,
  onDuplicateExercise,
  onReorderBlocks,
  onReorderExercises,
  dragHandleProps
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

  const blocksCount = day.program_blocks?.length || 0;

  return (
    <Card className="rounded-none relative w-full" style={{ minHeight: '30px' }}>
      <div 
        {...(dragHandleProps?.attributes || {})}
        {...(dragHandleProps?.listeners || {})}
        className="absolute left-0 top-0 bottom-0 w-3 md:w-4 flex items-center justify-center cursor-grab active:cursor-grabbing z-10 hover:bg-gray-100 transition-colors"
      >
        <GripVertical className="w-2 h-2 md:w-3 md:h-3 text-gray-400" />
      </div>
      
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <DayCardHeader
          dayName={day.name}
          isTestDay={day.is_test_day || false}
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
          <>
            <TestDaySelector
              isTestDay={day.is_test_day || false}
              selectedTestTypes={day.test_types || []}
              onTestDayChange={(isTestDay) => onUpdateDayTestDay(isTestDay, day.test_types || [])}
              onTestTypesChange={(testTypes) => onUpdateDayTestDay(day.is_test_day || false, testTypes)}
            />
            
            <CompetitionDaySelector
              isCompetitionDay={day.is_competition_day || false}
              onCompetitionDayChange={onUpdateDayCompetitionDay}
            />
            
            <DayCardContent
            blocks={day.program_blocks || []}
            exercises={exercises}
            selectedUserId={selectedUserId}
            onAddExercise={onAddExercise}
            onRemoveBlock={onRemoveBlock}
            onDuplicateBlock={onDuplicateBlock}
            onUpdateBlockName={onUpdateBlockName}
            onUpdateBlockTrainingType={onUpdateBlockTrainingType}
            onUpdateExercise={onUpdateExercise}
            onRemoveExercise={onRemoveExercise}
            onDuplicateExercise={onDuplicateExercise}
            onReorderBlocks={onReorderBlocks}
            onReorderExercises={onReorderExercises}
          />
          </>
        )}
        
        <DayCalculations 
          blocks={day.program_blocks || []} 
          exercises={exercises} 
        />
      </Collapsible>
    </Card>
  );
};
