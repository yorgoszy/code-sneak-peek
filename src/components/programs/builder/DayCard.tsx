
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { DayCardHeader } from './DayCardHeader';
import { DayCardContent } from './DayCardContent';
import { DayCalculations } from './DayCalculations';
import type { DayStructure, ExerciseStructure } from './hooks/useProgramBuilderState';
import type { Exercise } from '../types';

interface DayCardProps {
  day: DayStructure;
  weekId: string;
  exercises: Exercise[];
  onUpdateDayName: (dayId: string, name: string) => void;
  onRemoveDay: (dayId: string) => void;
  onDuplicateDay: (dayId: string) => void;
  onAddBlock: () => void;
  onRemoveBlock: (blockId: string) => void;
  onDuplicateBlock: (blockId: string) => void;
  onUpdateBlockName: (blockId: string, name: string) => void;
  onAddExercise: (blockId: string, exerciseId: string) => void;
  onRemoveExercise: (exerciseId: string) => void;
  onUpdateExercise: (exerciseId: string, field: string, value: any) => void;
  onDuplicateExercise: (exerciseId: string) => void;
  onReorderBlocks: (oldIndex: number, newIndex: number) => void;
  onReorderExercises: (blockId: string, oldIndex: number, newIndex: number) => void;
}

export const DayCard: React.FC<DayCardProps> = ({
  day,
  weekId,
  exercises,
  onUpdateDayName,
  onRemoveDay,
  onDuplicateDay,
  onAddBlock,
  onRemoveBlock,
  onDuplicateBlock,
  onUpdateBlockName,
  onAddExercise,
  onRemoveExercise,
  onUpdateExercise,
  onDuplicateExercise,
  onReorderBlocks,
  onReorderExercises
}) => {
  return (
    <Card className="rounded-none border-2">
      <CardContent className="p-4">
        <DayCardHeader
          day={day}
          onUpdateDayName={onUpdateDayName}
          onRemoveDay={onRemoveDay}
          onDuplicateDay={onDuplicateDay}
        />
        
        <DayCardContent
          day={day}
          weekId={weekId}
          exercises={exercises}
          onAddBlock={onAddBlock}
          onRemoveBlock={onRemoveBlock}
          onDuplicateBlock={onDuplicateBlock}
          onUpdateBlockName={onUpdateBlockName}
          onAddExercise={onAddExercise}
          onRemoveExercise={onRemoveExercise}
          onUpdateExercise={onUpdateExercise}
          onDuplicateExercise={onDuplicateExercise}
          onReorderBlocks={onReorderBlocks}
          onReorderExercises={onReorderExercises}
        />

        <DayCalculations day={day} />
      </CardContent>
    </Card>
  );
};
