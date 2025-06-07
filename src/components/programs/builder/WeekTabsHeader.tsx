
import React from 'react';
import { TabsList } from "@/components/ui/tabs";
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableWeekTab } from './SortableWeekTab';
import type { Week, Exercise } from '../types';

// Transform interface for WeekMetrics compatibility
interface WeekWithMetrics extends Week {
  days: Array<{
    id: string;
    name: string;
    day_number: number;
    blocks: Array<{
      id: string;
      name: string;
      block_order: number;
      exercises: Array<{
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
          {weeks.map((week, index) => (
            <SortableWeekTab
              key={week.id}
              week={week}
              previousWeek={index > 0 ? weeks[index - 1] : undefined}
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
          ))}
        </SortableContext>
      </TabsList>
    </div>
  );
};
