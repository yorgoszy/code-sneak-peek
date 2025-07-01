
import React from 'react';
import { TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, GripVertical } from "lucide-react";
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableDayProps {
  day: any;
  dayIndex: number;
  week: any;
  isDayCompleted: boolean;
  onDoubleClick: (e: React.MouseEvent) => void;
  isEditing: boolean;
}

export const SortableDay: React.FC<SortableDayProps> = ({
  day,
  dayIndex,
  week,
  isDayCompleted,
  onDoubleClick,
  isEditing
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: day.id,
    disabled: !isEditing
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className={`${isDragging ? 'opacity-50' : ''}`}>
      <TabsTrigger 
        value={dayIndex.toString()} 
        className="rounded-none text-xs flex items-center gap-1 relative"
        onDoubleClick={onDoubleClick}
      >
        {isEditing && (
          <div
            {...attributes}
            {...listeners}
            className="absolute left-1 cursor-move"
          >
            <GripVertical className="w-3 h-3 text-gray-400" />
          </div>
        )}
        <div className={`flex items-center gap-1 ${isEditing ? 'ml-4' : ''}`}>
          {isDayCompleted && <CheckCircle className="w-3 h-3 text-[#00ffba]" />}
          {day.name || `Ημέρα ${day.day_number}`}
        </div>
      </TabsTrigger>
    </div>
  );
};
