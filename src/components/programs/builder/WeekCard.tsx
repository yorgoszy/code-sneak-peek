
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { WeekCardHeader } from './WeekCardHeader';
import { WeekCardContent } from './WeekCardContent';
import { WeekCalculations } from './WeekCalculations';
import type { Week } from './hooks/useProgramBuilderState';
import type { Exercise } from '../types';

interface WeekCardProps {
  week: Week;
  exercises: Exercise[];
  onUpdateWeekName: (weekId: string, name: string) => void;
  onRemoveWeek: (weekId: string) => void;
  onDuplicateWeek: (weekId: string) => void;
  onAddDay: () => void;
  onRemoveDay: (dayId: string) => void;
  onDuplicateDay: (dayId: string) => void;
  onUpdateDayName: (dayId: string, name: string) => void;
  onAddBlock: (dayId: string) => void;
  onRemoveBlock: (dayId: string, blockId: string) => void;
  onDuplicateBlock: (dayId: string, blockId: string) => void;
  onUpdateBlockName: (dayId: string, blockId: string, name: string) => void;
  onAddExercise: (dayId: string, blockId: string, exerciseId: string) => void;
  onRemoveExercise: (dayId: string, blockId: string, exerciseId: string) => void;
  onUpdateExercise: (dayId: string, blockId: string, exerciseId: string, field: string, value: any) => void;
  onDuplicateExercise: (dayId: string, blockId: string, exerciseId: string) => void;
  onReorderDays: (oldIndex: number, newIndex: number) => void;
  onReorderBlocks: (dayId: string, oldIndex: number, newIndex: number) => void;
  onReorderExercises: (dayId: string, blockId: string, oldIndex: number, newIndex: number) => void;
}

export const WeekCard: React.FC<WeekCardProps> = ({
  week,
  exercises,
  onUpdateWeekName,
  onRemoveWeek,
  onDuplicateWeek,
  onAddDay,
  onRemoveDay,
  onDuplicateDay,
  onUpdateDayName,
  onAddBlock,
  onRemoveBlock,
  onDuplicateBlock,
  onUpdateBlockName,
  onAddExercise,
  onRemoveExercise,
  onUpdateExercise,
  onDuplicateExercise,
  onReorderDays,
  onReorderBlocks,
  onReorderExercises
}) => {
  return (
    <Card className="rounded-none border-2 border-gray-300">
      <CardContent className="p-6">
        <WeekCardHeader
          week={week}
          onUpdateWeekName={onUpdateWeekName}
          onRemoveWeek={onRemoveWeek}
          onDuplicateWeek={onDuplicateWeek}
        />
        
        <WeekCardContent
          week={week}
          exercises={exercises}
          onAddDay={onAddDay}
          onRemoveDay={onRemoveDay}
          onDuplicateDay={onDuplicateDay}
          onUpdateDayName={onUpdateDayName}
          onAddBlock={onAddBlock}
          onRemoveBlock={onRemoveBlock}
          onDuplicateBlock={onDuplicateBlock}
          onUpdateBlockName={onUpdateBlockName}
          onAddExercise={onAddExercise}
          onRemoveExercise={onRemoveExercise}
          onUpdateExercise={onUpdateExercise}
          onDuplicateExercise={onDuplicateExercise}
          onReorderDays={onReorderDays}
          onReorderBlocks={onReorderBlocks}
          onReorderExercises={onReorderExercises}
        />

        <WeekCalculations week={week} />
      </CardContent>
    </Card>
  );
};
