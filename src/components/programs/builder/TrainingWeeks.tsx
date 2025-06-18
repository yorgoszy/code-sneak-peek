
import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { Exercise, Week } from '../types';
import { WeekTabsHeader } from './WeekTabsHeader';
import { WeekTabsContent } from './WeekTabsContent';
import { useWeekEditingState } from './hooks/useWeekEditingState';

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

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = weeks.findIndex(week => week.id === active.id);
      const newIndex = weeks.findIndex(week => week.id === over.id);
      onReorderWeeks(oldIndex, newIndex);
    }
  };

  return (
    <Card className="rounded-none">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Εβδομάδες Προπόνησης</CardTitle>
          <Button onClick={onAddWeek} className="rounded-none">
            <Plus className="w-4 h-4 mr-2" />
            +Week
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {weeks.length > 0 ? (
          <Tabs value={activeWeek} onValueChange={setActiveWeek} className="w-full">
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
            
            <WeekTabsContent
              weeks={weeks}
              exercises={exercises}
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
        ) : (
          <div className="text-center py-8 text-gray-500">
            Προσθέστε μια εβδομάδα για να ξεκινήσετε
          </div>
        )}
      </CardContent>
    </Card>
  );
};
