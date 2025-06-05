
import React from 'react';
import { TabsContent } from "@/components/ui/tabs";
import { WeekCard } from './WeekCard';
import { Exercise } from '../types';

interface ProgramExercise {
  id: string;
  exercise_id: string;
  exercise_name: string;
  sets: number;
  reps: string;
  percentage_1rm: number;
  kg: string;
  velocity_ms: string;
  tempo: string;
  rest: string;
  exercise_order: number;
}

interface Block {
  id: string;
  name: string;
  block_order: number;
  exercises: ProgramExercise[];
}

interface Day {
  id: string;
  name: string;
  day_number: number;
  blocks: Block[];
}

interface Week {
  id: string;
  name: string;
  week_number: number;
  days: Day[];
}

interface WeekTabsContentProps {
  weeks: Week[];
  exercises: Exercise[];
  onAddDay: (weekId: string) => void;
  onRemoveWeek: (weekId: string) => void;
  onAddBlock: (weekId: string, dayId: string) => void;
  onRemoveDay: (weekId: string, dayId: string) => void;
  onDuplicateDay: (weekId: string, dayId: string) => void;
  onUpdateDayName: (weekId: string, dayId: string, name: string) => void;
  onAddExercise: (weekId: string, dayId: string, blockId: string, exerciseId: string) => void;
  onRemoveBlock: (weekId: string, dayId: string, blockId: string) => void;
  onDuplicateBlock: (weekId: string, dayId: string, blockId: string) => void;
  onUpdateBlockName: (weekId: string, dayId: string, blockId: string, name: string) => void;
  onUpdateExercise: (weekId: string, dayId: string, blockId: string, exerciseId: string, field: string, value: any) => void;
  onRemoveExercise: (weekId: string, dayId: string, blockId: string, exerciseId: string) => void;
  onDuplicateExercise: (weekId: string, dayId: string, blockId: string, exerciseId: string) => void;
  onReorderDays: (weekId: string, oldIndex: number, newIndex: number) => void;
  onReorderBlocks: (weekId: string, dayId: string, oldIndex: number, newIndex: number) => void;
  onReorderExercises: (weekId: string, dayId: string, blockId: string, oldIndex: number, newIndex: number) => void;
}

export const WeekTabsContent: React.FC<WeekTabsContentProps> = ({
  weeks,
  exercises,
  onAddDay,
  onRemoveWeek,
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
  onReorderDays,
  onReorderBlocks,
  onReorderExercises
}) => {
  return (
    <>
      {weeks.map((week) => (
        <TabsContent key={week.id} value={week.id} className="mt-4">
          <WeekCard
            week={week}
            exercises={exercises}
            onAddDay={() => onAddDay(week.id)}
            onRemoveWeek={() => onRemoveWeek(week.id)}
            onAddBlock={(dayId) => onAddBlock(week.id, dayId)}
            onRemoveDay={(dayId) => onRemoveDay(week.id, dayId)}
            onDuplicateDay={(dayId) => onDuplicateDay(week.id, dayId)}
            onUpdateDayName={(dayId, name) => onUpdateDayName(week.id, dayId, name)}
            onAddExercise={(dayId, blockId, exerciseId) => onAddExercise(week.id, dayId, blockId, exerciseId)}
            onRemoveBlock={(dayId, blockId) => onRemoveBlock(week.id, dayId, blockId)}
            onDuplicateBlock={(dayId, blockId) => onDuplicateBlock(week.id, dayId, blockId)}
            onUpdateBlockName={(dayId, blockId, name) => onUpdateBlockName(week.id, dayId, blockId, name)}
            onUpdateExercise={(dayId, blockId, exerciseId, field, value) => 
              onUpdateExercise(week.id, dayId, blockId, exerciseId, field, value)
            }
            onRemoveExercise={(dayId, blockId, exerciseId) => 
              onRemoveExercise(week.id, dayId, blockId, exerciseId)
            }
            onDuplicateExercise={(dayId, blockId, exerciseId) => 
              onDuplicateExercise(week.id, dayId, blockId, exerciseId)
            }
            onReorderDays={(oldIndex, newIndex) => onReorderDays(week.id, oldIndex, newIndex)}
            onReorderBlocks={(dayId, oldIndex, newIndex) => onReorderBlocks(week.id, dayId, oldIndex, newIndex)}
            onReorderExercises={(dayId, blockId, oldIndex, newIndex) => onReorderExercises(week.id, dayId, blockId, oldIndex, newIndex)}
          />
        </TabsContent>
      ))}
    </>
  );
};
