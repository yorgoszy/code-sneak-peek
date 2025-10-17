
import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { Exercise, Week } from '../types';
import { WeekTabsHeader } from './WeekTabsHeader';
import { WeekTabsContent } from './WeekTabsContent';
import { useWeekEditingState } from './hooks/useWeekEditingState';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';

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
  const {
    activeWeek,
    setActiveWeek,
    editingWeekId,
    editingWeekName,
    setEditingWeekName,
    handleWeekNameDoubleClick,
    handleWeekNameSave,
    handleWeekNameKeyPress
  } = useWeekEditingState(weeks, onUpdateWeekName);

  useEffect(() => {
    if (weeks.length > 0 && !activeWeek) {
      setActiveWeek(weeks[0].id);
    }
  }, [weeks, activeWeek, setActiveWeek]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = weeks.findIndex(week => week.id === active.id);
    const newIndex = weeks.findIndex(week => week.id === over.id);
    
    if (oldIndex !== -1 && newIndex !== -1) {
      onReorderWeeks(oldIndex, newIndex);
    }
  };

  return (
    <Card className="rounded-none">
      <CardHeader className="p-3 md:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <CardTitle className="text-sm md:text-base">Εβδομάδες Προπόνησης</CardTitle>
          <Button onClick={onAddWeek} className="rounded-none w-full sm:w-auto text-xs md:text-sm" size="sm">
            <Plus className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">+Week</span>
            <span className="sm:hidden">+ Εβδομάδα</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-3 md:p-6">
        {weeks.length > 0 ? (
          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <Tabs value={activeWeek} onValueChange={setActiveWeek} className="w-full">
              <SortableContext items={weeks.map(week => week.id)} strategy={horizontalListSortingStrategy}>
                <WeekTabsHeader
                  weeks={weeks}
                  editingWeekId={editingWeekId}
                  editingWeekName={editingWeekName}
                  activeWeek={activeWeek}
                  onWeekNameDoubleClick={handleWeekNameDoubleClick}
                  onWeekNameSave={handleWeekNameSave}
                  onWeekNameKeyPress={handleWeekNameKeyPress}
                  setEditingWeekName={setEditingWeekName}
                  onDuplicateWeek={onDuplicateWeek}
                  onRemoveWeek={onRemoveWeek}
                />
              </SortableContext>
              
              <WeekTabsContent
                weeks={weeks}
                exercises={exercises}
                selectedUserId={selectedUserId}
                onAddDay={onAddDay}
                onRemoveWeek={onRemoveWeek}
                onAddBlock={onAddBlock}
                onRemoveDay={onRemoveDay}
                onDuplicateDay={onDuplicateDay}
                onUpdateDayName={onUpdateDayName}
                onAddExercise={onAddExercise}
                onRemoveBlock={onRemoveBlock}
                onDuplicateBlock={onDuplicateBlock}
                onUpdateBlockName={onUpdateBlockName}
                onUpdateExercise={onUpdateExercise}
                onRemoveExercise={onRemoveExercise}
                onDuplicateExercise={onDuplicateExercise}
                onReorderDays={onReorderDays}
                onReorderBlocks={onReorderBlocks}
                onReorderExercises={onReorderExercises}
              />
            </Tabs>
          </DndContext>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Προσθέστε μια εβδομάδα για να ξεκινήσετε
          </div>
        )}
      </CardContent>
    </Card>
  );
};
