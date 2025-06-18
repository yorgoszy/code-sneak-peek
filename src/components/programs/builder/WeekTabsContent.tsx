
import React from 'react';
import { TabsContent } from "@/components/ui/tabs";
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableDay } from './SortableDay';
import { Exercise, Week } from '../types';

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
  onUpdateBlock: (weekId: string, dayId: string, blockId: string, field: string, value: any) => void;
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
  onUpdateBlock,
  onUpdateExercise,
  onRemoveExercise,
  onDuplicateExercise,
  onReorderDays,
  onReorderBlocks,
  onReorderExercises
}) => {
  const handleDayDragEnd = (weekId: string) => (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const week = weeks.find(w => w.id === weekId);
      if (!week) return;
      
      const oldIndex = week.program_days?.findIndex(day => day.id === active.id) || 0;
      const newIndex = week.program_days?.findIndex(day => day.id === over.id) || 0;
      onReorderDays(weekId, oldIndex, newIndex);
    }
  };

  return (
    <>
      {weeks.map((week) => (
        <TabsContent key={week.id} value={week.id} className="mt-4">
          <DndContext collisionDetection={closestCenter} onDragEnd={handleDayDragEnd(week.id)}>
            <SortableContext items={week.program_days?.map(d => d.id) || []} strategy={verticalListSortingStrategy}>
              <div className="space-y-4">
                {week.program_days?.map((day) => (
                  <SortableDay
                    key={day.id}
                    day={day}
                    exercises={exercises}
                    onAddBlock={() => onAddBlock(week.id, day.id)}
                    onRemoveDay={() => onRemoveDay(week.id, day.id)}
                    onDuplicateDay={() => onDuplicateDay(week.id, day.id)}
                    onUpdateDayName={(name) => onUpdateDayName(week.id, day.id, name)}
                    onAddExercise={(blockId, exerciseId) => onAddExercise(week.id, day.id, blockId, exerciseId)}
                    onRemoveBlock={(blockId) => onRemoveBlock(week.id, day.id, blockId)}
                    onDuplicateBlock={(blockId) => onDuplicateBlock(week.id, day.id, blockId)}
                    onUpdateBlockName={(blockId, name) => onUpdateBlockName(week.id, day.id, blockId, name)}
                    onUpdateBlock={(blockId, field, value) => onUpdateBlock(week.id, day.id, blockId, field, value)}
                    onUpdateExercise={(blockId, exerciseId, field, value) => 
                      onUpdateExercise(week.id, day.id, blockId, exerciseId, field, value)
                    }
                    onRemoveExercise={(blockId, exerciseId) => onRemoveExercise(week.id, day.id, blockId, exerciseId)}
                    onDuplicateExercise={(blockId, exerciseId) => onDuplicateExercise(week.id, day.id, blockId, exerciseId)}
                    onReorderBlocks={(oldIndex, newIndex) => onReorderBlocks(week.id, day.id, oldIndex, newIndex)}
                    onReorderExercises={(blockId, oldIndex, newIndex) => onReorderExercises(week.id, day.id, blockId, oldIndex, newIndex)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </TabsContent>
      ))}
    </>
  );
};
