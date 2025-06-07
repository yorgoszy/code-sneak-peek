
import React from 'react';
import { TabsList } from "@/components/ui/tabs";
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableWeekTab } from './SortableWeekTab';
import type { Week } from '../types';

interface WeekTabsHeaderProps {
  weeks: Week[];
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
