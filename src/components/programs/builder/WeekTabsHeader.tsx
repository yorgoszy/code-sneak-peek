
import React from 'react';
import { TabsList } from "@/components/ui/tabs";
import { Week } from '../types';
import { SortableWeekTab } from './SortableWeekTab';

interface WeekTabsHeaderProps {
  weeks: Week[];
  editingWeekId: string | null;
  editingWeekName: string;
  activeWeek: string | null;
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
    <div className="overflow-x-auto scrollbar-thin">
      <TabsList className="h-auto p-0 bg-transparent gap-1 flex-nowrap w-max min-w-full justify-start">
        {weeks.map((week, index) => {
          const previousWeek = index > 0 ? weeks[index - 1] : undefined;
          return (
            <SortableWeekTab
              key={week.id}
              week={week}
              previousWeek={previousWeek}
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
      </TabsList>
    </div>
  );
};
