
import React from 'react';
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WeekCard } from './WeekCard';
import { Exercise } from '../types';

interface Week {
  id: string;
  name: string;
  week_number: number;
  days?: Day[];
}

interface Day {
  id: string;
  name: string;
  day_number: number;
  blocks?: Block[];
}

interface Block {
  id: string;
  name: string;
  exercises?: ProgramExercise[];
}

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

interface TrainingWeeksProps {
  weeks: Week[];
  exercises: Exercise[];
  selectedUserId?: string;
  onAddWeek: () => void;
  onRemoveWeek: (weekId: string) => void;
  onDuplicateWeek: (weekId: string) => void;
  onUpdateWeekName: (weekId: string, name: string) => void;
  onAddDay: (weekId: string) => void;
  onRemoveDay: (weekId: string, dayId: string) => void;
  onDuplicateDay: (weekId: string, dayId: string) => void;
  onUpdateDayName: (weekId: string, dayId: string, name: string) => void;
  onAddBlock: (weekId: string, dayId: string) => void;
  onRemoveBlock: (weekId: string, dayId: string, blockId: string) => void;
  onDuplicateBlock: (weekId: string, dayId: string, blockId: string) => void;
  onUpdateBlockName: (weekId: string, dayId: string, blockId: string, name: string) => void;
  onAddExercise: (weekId: string, dayId: string, blockId: string, exerciseId: string) => void;
  onRemoveExercise: (weekId: string, dayId: string, blockId: string, exerciseId: string) => void;
  onUpdateExercise: (weekId: string, dayId: string, blockId: string, exerciseId: string, field: string, value: any) => void;
  onDuplicateExercise: (weekId: string, dayId: string, blockId: string, exerciseId: string) => void;
  onReorderWeeks: (oldIndex: number, newIndex: number) => void;
  onReorderDays: (weekId: string, oldIndex: number, newIndex: number) => void;
  onReorderBlocks: (weekId: string, dayId: string, oldIndex: number, newIndex: number) => void;
  onReorderExercises: (weekId: string, dayId: string, blockId: string, oldIndex: number, newIndex: number) => void;
}

export const TrainingWeeks: React.FC<TrainingWeeksProps> = ({
  weeks,
  exercises,
  selectedUserId,
  onAddWeek,
  onRemoveWeek,
  onDuplicateWeek,
  onUpdateWeekName,
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
  onReorderWeeks,
  onReorderDays,
  onReorderBlocks,
  onReorderExercises
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Εβδομάδες Προπόνησης</h3>
        <Button onClick={onAddWeek} className="rounded-none">
          <Plus className="w-4 h-4 mr-2" />
          Προσθήκη Εβδομάδας
        </Button>
      </div>

      {weeks.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Δεν υπάρχουν εβδομάδες. Προσθέστε την πρώτη εβδομάδα για να ξεκινήσετε.
        </div>
      ) : (
        <Tabs defaultValue={weeks[0]?.id} className="w-full">
          <TabsList className="grid w-full rounded-none" style={{ gridTemplateColumns: `repeat(${weeks.length}, 1fr)` }}>
            {weeks.map((week) => (
              <TabsTrigger key={week.id} value={week.id} className="rounded-none">
                {week.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {weeks.map((week) => (
            <TabsContent key={week.id} value={week.id}>
              <WeekCard
                week={week}
                exercises={exercises}
                selectedUserId={selectedUserId}
                onRemoveWeek={() => onRemoveWeek(week.id)}
                onDuplicateWeek={() => onDuplicateWeek(week.id)}
                onUpdateWeekName={(name) => onUpdateWeekName(week.id, name)}
                onAddDay={() => onAddDay(week.id)}
                onRemoveDay={(dayId) => onRemoveDay(week.id, dayId)}
                onDuplicateDay={(dayId) => onDuplicateDay(week.id, dayId)}
                onUpdateDayName={(dayId, name) => onUpdateDayName(week.id, dayId, name)}
                onAddBlock={(dayId) => onAddBlock(week.id, dayId)}
                onRemoveBlock={(dayId, blockId) => onRemoveBlock(week.id, dayId, blockId)}
                onDuplicateBlock={(dayId, blockId) => onDuplicateBlock(week.id, dayId, blockId)}
                onUpdateBlockName={(dayId, blockId, name) => onUpdateBlockName(week.id, dayId, blockId, name)}
                onAddExercise={(dayId, blockId, exerciseId) => onAddExercise(week.id, dayId, blockId, exerciseId)}
                onRemoveExercise={(dayId, blockId, exerciseId) => onRemoveExercise(week.id, dayId, blockId, exerciseId)}
                onUpdateExercise={(dayId, blockId, exerciseId, field, value) => onUpdateExercise(week.id, dayId, blockId, exerciseId, field, value)}
                onDuplicateExercise={(dayId, blockId, exerciseId) => onDuplicateExercise(week.id, dayId, blockId, exerciseId)}
                onReorderDays={(oldIndex, newIndex) => onReorderDays(week.id, oldIndex, newIndex)}
                onReorderBlocks={(dayId, oldIndex, newIndex) => onReorderBlocks(week.id, dayId, oldIndex, newIndex)}
                onReorderExercises={(dayId, blockId, oldIndex, newIndex) => onReorderExercises(week.id, dayId, blockId, oldIndex, newIndex)}
              />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
};
