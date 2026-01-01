
import React, { useEffect } from 'react';
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
  onUpdateDayTestDay: (weekId: string, dayId: string, isTestDay: boolean, testTypes: string[]) => void;
  onUpdateDayCompetitionDay: (weekId: string, dayId: string, isCompetitionDay: boolean) => void;
  onAddBlock: (weekId: string, dayId: string) => void;
  onRemoveBlock: (weekId: string, dayId: string, blockId: string) => void;
  onDuplicateBlock: (weekId: string, dayId: string, blockId: string) => void;
  onUpdateBlockName: (weekId: string, dayId: string, blockId: string, name: string) => void;
  onUpdateBlockTrainingType: (weekId: string, dayId: string, blockId: string, trainingType: string) => void;
  onUpdateBlockWorkoutFormat: (weekId: string, dayId: string, blockId: string, format: string) => void;
  onUpdateBlockWorkoutDuration: (weekId: string, dayId: string, blockId: string, duration: string) => void;
  onUpdateBlockSets: (weekId: string, dayId: string, blockId: string, sets: number) => void;
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
  onUpdateDayTestDay,
  onUpdateDayCompetitionDay,
  onAddBlock,
  onRemoveBlock,
  onDuplicateBlock,
  onUpdateBlockName,
  onUpdateBlockTrainingType,
  onUpdateBlockWorkoutFormat,
  onUpdateBlockWorkoutDuration,
  onUpdateBlockSets,
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
    <div className="border rounded-none">
      {/* Compact header */}
      <div className="flex items-center justify-between p-2 border-b bg-gray-50">
        <span className="text-sm font-medium">Εβδομάδες</span>
        <div className="flex items-center gap-1">
          <Button onClick={onAddWeek} variant="outline" className="rounded-none h-7 px-2 text-xs" size="sm">
            <Plus className="w-3 h-3 mr-1" />
            Week
          </Button>
          <Button 
            onClick={() => {
              const targetWeekId = activeWeek || weeks[0]?.id;
              if (targetWeekId) {
                setActiveWeek(targetWeekId);
                onAddDay(targetWeekId);
              }
            }} 
            disabled={weeks.length === 0}
            variant="outline"
            className="rounded-none h-7 px-2 text-xs" 
            size="sm"
          >
            <Plus className="w-3 h-3 mr-1" />
            Day
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-2">
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
                onUpdateDayTestDay={onUpdateDayTestDay}
                onUpdateDayCompetitionDay={onUpdateDayCompetitionDay}
                onAddExercise={onAddExercise}
                onRemoveBlock={onRemoveBlock}
                onDuplicateBlock={onDuplicateBlock}
                onUpdateBlockName={onUpdateBlockName}
                onUpdateBlockTrainingType={onUpdateBlockTrainingType}
                onUpdateBlockWorkoutFormat={onUpdateBlockWorkoutFormat}
                onUpdateBlockWorkoutDuration={onUpdateBlockWorkoutDuration}
                onUpdateBlockSets={onUpdateBlockSets}
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
          <div className="text-center py-6 text-gray-500 text-sm">
            Πατήστε +Week για να ξεκινήσετε
          </div>
        )}
      </div>
    </div>
  );
};
