
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
  onPasteWeek?: (clipboardWeek: Week) => void;
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
  onPasteBlock: (weekId: string, dayId: string, clipboardBlock: any) => void;
  onPasteBlockAtBlock: (weekId: string, dayId: string, blockId: string, clipboardBlock: any) => void;
  onPasteDay: (weekId: string, clipboardDay: any) => void;
  onSelectBlockTemplate?: (weekId: string, dayId: string, blockId: string, template: any) => void;
}

export const TrainingWeeks: React.FC<TrainingWeeksProps> = ({
  weeks,
  exercises,
  selectedUserId,
  onAddWeek,
  onRemoveWeek,
  onDuplicateWeek,
  onUpdateWeekName,
  onPasteWeek,
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
  onReorderExercises,
  onPasteBlock,
  onPasteBlockAtBlock,
  onPasteDay,
  onSelectBlockTemplate
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
      {/* Compact header with week tabs inline */}
      <div className="flex items-start p-1 border-b bg-gray-50">
        {weeks.length > 0 ? (
          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <Tabs value={activeWeek} onValueChange={setActiveWeek} className="flex-1 min-w-0">
              <div className="flex items-start gap-2 w-full">
                {/* Scrollable weeks container */}
                <div className="flex-1 min-w-0 overflow-x-auto">
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
                      onPasteWeek={onPasteWeek}
                    />
                  </SortableContext>
                </div>
                {/* Fixed position buttons */}
                <div className="flex flex-col gap-0.5 flex-shrink-0">
                  <Button onClick={onAddWeek} variant="outline" className="rounded-none h-5 px-1.5 text-[9px]" size="sm">
                    <Plus className="w-2.5 h-2.5 mr-0.5" />
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
                    className="rounded-none h-5 px-1.5 text-[9px]" 
                    size="sm"
                  >
                    <Plus className="w-2.5 h-2.5 mr-0.5" />
                    Day
                  </Button>
                </div>
              </div>
              
              {/* Content */}
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
                onPasteBlock={onPasteBlock}
                onPasteBlockAtBlock={onPasteBlockAtBlock}
                onPasteDay={onPasteDay}
                onSelectBlockTemplate={onSelectBlockTemplate}
              />
            </Tabs>
          </DndContext>
        ) : (
          <div className="flex items-start justify-between w-full">
            <span className="text-[10px] text-gray-500">Πατήστε +Week για να ξεκινήσετε</span>
            <div className="flex flex-col gap-0.5 flex-shrink-0">
              <Button onClick={onAddWeek} variant="outline" className="rounded-none h-5 px-1.5 text-[9px]" size="sm">
                <Plus className="w-2.5 h-2.5 mr-0.5" />
                Week
              </Button>
              <Button 
                disabled
                variant="outline"
                className="rounded-none h-5 px-1.5 text-[9px]" 
                size="sm"
              >
                <Plus className="w-2.5 h-2.5 mr-0.5" />
                Day
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
