
import React from 'react';
import { Button } from "@/components/ui/button";
import { TabsTrigger } from "@/components/ui/tabs";
import { Copy, Trash2, GripVertical } from "lucide-react";
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { WeekMetrics } from './WeekMetrics';
import { Week } from '../types';

interface SortableWeekTabProps {
  week: Week;
  previousWeek?: Week;
  isActive: boolean;
  editingWeekId: string | null;
  editingWeekName: string;
  onWeekNameDoubleClick: (week: Week) => void;
  onWeekNameSave: () => void;
  onWeekNameKeyPress: (e: React.KeyboardEvent) => void;
  setEditingWeekName: (name: string) => void;
  onDuplicateWeek: (weekId: string) => void;
  onRemoveWeek: (weekId: string) => void;
}

export const SortableWeekTab: React.FC<SortableWeekTabProps> = ({
  week,
  previousWeek,
  isActive,
  editingWeekId,
  editingWeekName,
  onWeekNameDoubleClick,
  onWeekNameSave,
  onWeekNameKeyPress,
  setEditingWeekName,
  onDuplicateWeek,
  onRemoveWeek
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: week.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="flex flex-col items-center group flex-shrink-0 relative"
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-4 flex items-center justify-center cursor-move z-10"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-3 h-3 text-gray-400" />
      </div>
      
      <div className="ml-4 flex flex-col items-center">
        <div className="flex items-center">
          <TabsTrigger 
            value={week.id} 
            className="rounded-none whitespace-nowrap px-4"
            onDoubleClick={() => onWeekNameDoubleClick(week)}
          >
            {editingWeekId === week.id ? (
              <input
                type="text"
                value={editingWeekName}
                onChange={(e) => setEditingWeekName(e.target.value)}
                onBlur={onWeekNameSave}
                onKeyDown={onWeekNameKeyPress}
                className="bg-transparent border-none outline-none text-center min-w-0"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <div className="flex flex-col items-center">
                <span>{week.name}</span>
              </div>
            )}
          </TabsTrigger>
          <div className="flex opacity-0 group-hover:opacity-100 transition-opacity ml-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicateWeek(week.id);
              }}
              className="h-6 w-6 p-0 rounded-none"
            >
              <Copy className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveWeek(week.id);
              }}
              className="h-6 w-6 p-0 rounded-none text-red-600 hover:text-red-800"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
        
        {/* Week Metrics below the tab name */}
        <div className="mt-2 w-full">
          <WeekMetrics week={week} previousWeek={previousWeek} />
        </div>
      </div>
    </div>
  );
};
