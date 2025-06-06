
import React from 'react';
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Copy, Trash2 } from "lucide-react";

interface Week {
  id: string;
  name: string;
  week_number: number;
  days: any[];
}

interface WeekTabsHeaderProps {
  weeks: Week[];
  editingWeekId: string | null;
  editingWeekName: string;
  activeWeek: string;
  onWeekNameDoubleClick: (weekId: string) => void;
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
    <div className="space-y-2">
      {/* Weeks Tabs - Responsive Grid */}
      <div className="overflow-x-auto">
        <TabsList className="grid h-auto min-w-full rounded-none p-1" 
                 style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(120px, 1fr))` }}>
          {weeks.map((week) => (
            <TabsTrigger
              key={week.id}
              value={week.id}
              className="rounded-none data-[state=active]:bg-[#00ffba]/20 data-[state=active]:text-black text-xs sm:text-sm p-2 min-w-[120px]"
            >
              {editingWeekId === week.id ? (
                <Input
                  value={editingWeekName}
                  onChange={(e) => setEditingWeekName(e.target.value)}
                  onBlur={onWeekNameSave}
                  onKeyPress={onWeekNameKeyPress}
                  className="h-6 text-xs px-1 rounded-none bg-white"
                  autoFocus
                />
              ) : (
                <span
                  onDoubleClick={() => onWeekNameDoubleClick(week.id)}
                  className="cursor-pointer truncate"
                  title={week.name}
                >
                  {week.name}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {/* Week Actions - Mobile Friendly */}
      {activeWeek && (
        <div className="flex flex-wrap gap-1 sm:gap-2 justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDuplicateWeek(activeWeek)}
            className="rounded-none text-xs h-7 px-2"
          >
            <Copy className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline">Duplicate</span>
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onRemoveWeek(activeWeek)}
            className="rounded-none text-xs h-7 px-2"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline">Delete</span>
          </Button>
        </div>
      )}
    </div>
  );
};
