
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
  displayName?: string;
}

export const SortableDay: React.FC<SortableDayProps> = ({
  day,
  dayIndex,
  week,
  isDayCompleted,
  onDoubleClick,
  isEditing,
  displayName
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
    <div ref={setNodeRef} style={style} className={`${isDragging ? 'opacity-50' : ''} flex-1`}>
      <TabsTrigger 
        value={dayIndex.toString()} 
        className={`
          rounded-none flex items-center gap-1 relative w-full
          ${isEditing ? 'h-6 text-xs px-1' : 'text-xs'}
        `}
        onDoubleClick={onDoubleClick}
      >
        {isEditing && (
          <div
            {...attributes}
            {...listeners}
            className="absolute left-0.5 cursor-move z-10"
          >
            <GripVertical className="w-2 h-2 text-gray-400" />
          </div>
        )}
        <div className={`flex items-center gap-0.5 ${isEditing ? 'ml-3 text-xs' : ''} truncate`}>
          {isDayCompleted && <CheckCircle className="w-2 h-2 text-[#00ffba] flex-shrink-0" />}
          <span className="truncate text-xs">
            {displayName || day.name || `Ημέρα ${day.day_number}`}
          </span>
        </div>
      </TabsTrigger>
    </div>
  );
};
