
import React from 'react';
import { Card, CardHeader } from "@/components/ui/card";
import { Collapsible } from "@/components/ui/collapsible";
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
  return (
    <Card className="rounded-none">
      <Collapsible defaultOpen>
        <CardHeader className="pb-2">
          <DayCardHeader
            day={day}
            onAddBlock={onAddBlock}
            onRemoveDay={onRemoveDay}
            onDuplicateDay={onDuplicateDay}
            onUpdateDayName={onUpdateDayName}
          />
        </CardHeader>
        
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
      </Collapsible>
    </Card>
  );
};
