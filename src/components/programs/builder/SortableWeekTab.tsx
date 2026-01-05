
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
      className="flex items-center group flex-shrink-0 relative min-w-0 h-[44px]"
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-3 flex items-center justify-center cursor-move z-10"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-2 h-2 text-gray-400" />
      </div>
      
      <div className="ml-3 flex flex-col justify-center min-w-0 h-full py-0.5">
        <div className="flex items-center min-w-0">
          <TabsTrigger 
            value={week.id} 
            className={`rounded-none whitespace-nowrap px-2 text-[10px] h-5 min-w-0 transition-colors ${
              isActive ? 'bg-foreground/10 font-semibold' : ''
            }`}
            onDoubleClick={() => onWeekNameDoubleClick(week)}
          >
            {editingWeekId === week.id ? (
                <input
                  type="text"
                  value={editingWeekName}
                  onChange={(e) => setEditingWeekName(e.target.value)}
                  onBlur={onWeekNameSave}
                  onKeyDown={onWeekNameKeyPress}
                  className="bg-transparent border-none outline-none text-center min-w-0 text-[10px]"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
            ) : (
              <span>{week.name}</span>
            )}
          </TabsTrigger>
          <div className="flex opacity-0 group-hover:opacity-100 transition-opacity ml-0.5">
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicateWeek(week.id);
              }}
              className="h-4 w-4 p-0 rounded-none"
            >
              <Copy className="w-2 h-2" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveWeek(week.id);
              }}
              className="h-4 w-4 p-0 rounded-none text-red-600 hover:text-red-800"
            >
              <Trash2 className="w-2 h-2" />
            </Button>
          </div>
        </div>
        
        <WeekMetrics week={week} previousWeek={previousWeek} />
      </div>
    </div>
  );
};
