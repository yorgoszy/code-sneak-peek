
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { CompactWeekCard } from './CompactWeekCard';
import { Exercise, Week, Day } from '../types';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { DndContext, closestCenter } from '@dnd-kit/core';

interface WeekCardProps {
  week: Week;
  exercises: Exercise[];
  onAddDay: () => void;
  onRemoveWeek: () => void;
  onAddBlock: (dayId: string) => void;
  onRemoveDay: (dayId: string) => void;
  onDuplicateDay: (dayId: string) => void;
  onUpdateDayName: (dayId: string, name: string) => void;
  onAddExercise: (dayId: string, blockId: string, exerciseId: string) => void;
  onRemoveBlock: (dayId: string, blockId: string) => void;
  onDuplicateBlock: (dayId: string, blockId: string) => void;
  onUpdateBlockName: (dayId: string, blockId: string, name: string) => void;
  onUpdateExercise: (dayId: string, blockId: string, exerciseId: string, field: string, value: any) => void;
  onRemoveExercise: (dayId: string, blockId: string, exerciseId: string) => void;
  onDuplicateExercise: (dayId: string, blockId: string, exerciseId: string) => void;
  onReorderDays: (oldIndex: number, newIndex: number) => void;
  onReorderBlocks: (dayId: string, oldIndex: number, newIndex: number) => void;
  onReorderExercises: (dayId: string, blockId: string, oldIndex: number, newIndex: number) => void;
}

export const WeekCard: React.FC<WeekCardProps> = ({
  week,
  exercises,
  onAddDay,
  onRemoveWeek
}) => {
  return (
    <div className="space-y-2">
      {/* Compact Week Preview */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">{week.name}</h3>
        <div className="flex gap-1">
          <Button 
            onClick={onAddDay}
            size="sm"
            className="rounded-none text-xs h-6 px-2"
          >
            <Plus className="w-3 h-3 mr-1" />
            Day
          </Button>
          <Button
            onClick={onRemoveWeek}
            size="sm"
            variant="destructive"
            className="rounded-none h-6 px-2"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
      
      <CompactWeekCard week={week} exercises={exercises} />
    </div>
  );
};
