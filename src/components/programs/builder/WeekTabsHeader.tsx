
import React from 'react';
import { TabsList } from "@/components/ui/tabs";
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableWeekTab } from './SortableWeekTab';
import type { Week, Exercise } from '../types';

// Transform interface for WeekMetrics compatibility - using program_days to match Week type
interface WeekWithMetrics extends Week {
  program_days: Array<{
    id: string;
    name: string;
    day_number: number;
    program_blocks: Array<{
      id: string;
      name: string;
      block_order: number;
      program_exercises: Array<{
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
      }>;
    }>;
  }>;
}

interface WeekTabsHeaderProps {
  weeks: WeekWithMetrics[];
  editingWeekId: string | null;
  editingWeekName: string;
  activeWeek: string;
  onWeekNameDoubleClick: (week: Week) => void;
  onWeekNameSave: () => void;
  onWeekNameKeyPress: (e: React.KeyboardEvent) => void;
  setEditingWeekName: (name: string) => void;
  onDuplicateWeek: (weekId: string) => void;
  onRemoveWeek: (weekId: string) => void;
}

export const WeekTabsHeader: React.FC<WeekTabsHeaderProps> = ({
  weeks,
  editingWeekId,
  editingWeekName,
  activeWeek,
  onWeekNameDoubleClick,
  onWeekNameSave,
  onWeekNameKeyPress,
  setEditingWeekName,
  onDuplicateWeek,
  onRemoveWeek
}) => {
  return (
    <div className="w-full overflow-x-auto">
      <TabsList className="inline-flex h-auto items-start justify-start rounded-none bg-muted p-1 text-muted-foreground min-w-full">
        <SortableContext items={weeks.map(w => w.id)} strategy={horizontalListSortingStrategy}>
          {weeks.map((week, index) => {
            // Transform week to match SortableWeekTab expected format (with days instead of program_days)
            const transformedWeek = {
              ...week,
              days: week.program_days.map(day => ({
                ...day,
                blocks: day.program_blocks.map(block => ({
                  ...block,
                  exercises: block.program_exercises.map(pe => ({
                    id: pe.id,
                    exercise_id: pe.exercise_id,
                    exercise_name: pe.exercise_name,
                    sets: pe.sets,
                    reps: pe.reps || '',
                    percentage_1rm: pe.percentage_1rm || 0,
                    kg: pe.kg || '',
                    velocity_ms: pe.velocity_ms?.toString() || '',
                    tempo: pe.tempo || '',
                    rest: pe.rest || '',
                    exercise_order: pe.exercise_order
                  }))
                }))
              }))
            };

            return (
              <SortableWeekTab
                key={week.id}
                week={transformedWeek}
                previousWeek={index > 0 ? {
                  ...weeks[index - 1],
                  days: weeks[index - 1].program_days.map(day => ({
                    ...day,
                    blocks: day.program_blocks.map(block => ({
                      ...block,
                      exercises: block.program_exercises.map(pe => ({
                        id: pe.id,
                        exercise_id: pe.exercise_id,
                        exercise_name: pe.exercise_name,
                        sets: pe.sets,
                        reps: pe.reps || '',
                        percentage_1rm: pe.percentage_1rm || 0,
                        kg: pe.kg || '',
                        velocity_ms: pe.velocity_ms?.toString() || '',
                        tempo: pe.tempo || '',
                        rest: pe.rest || '',
                        exercise_order: pe.exercise_order
                      }))
                    }))
                  }))
                } : undefined}
                isActive={activeWeek === week.id}
                editingWeekId={editingWeekId}
                editingWeekName={editingWeekName}
                onWeekNameDoubleClick={onWeekNameDoubleClick}
                onWeekNameSave={onWeekNameSave}
                onWeekNameKeyPress={onWeekNameKeyPress}
                setEditingWeekName={setEditingWeekName}
                onDuplicateWeek={onDuplicateWeek}
                onRemoveWeek={onRemoveWeek}
              />
            );
          })}
        </SortableContext>
      </TabsList>
    </div>
  );
};
