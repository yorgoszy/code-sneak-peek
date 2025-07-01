
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from "lucide-react";
import { EditableProgramDayTab } from './EditableProgramDayTab';

interface SortableDayProps {
  day: any;
  dayIndex: number;
  week: any;
  editMode: boolean;
  isEditing: boolean;
  isWorkoutCompleted: (weekNumber: number, dayNumber: number) => boolean;
  onAddNewBlock: (dayId: string) => void;
  onAddExercise: (blockId: string, exerciseId: string) => void;
  onRemoveBlock: (blockId: string) => void;
  onRemoveExercise: (exerciseId: string) => void;
  onUpdateExercise: (exerciseId: string, field: string, value: any) => void;
}

export const SortableDay: React.FC<SortableDayProps> = ({
  day,
  dayIndex,
  week,
  editMode,
  isEditing,
  isWorkoutCompleted,
  onAddNewBlock,
  onAddExercise,
  onRemoveBlock,
  onRemoveExercise,
  onUpdateExercise
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
    <div
      ref={setNodeRef}
      style={style}
      className={`${isDragging ? 'opacity-50' : ''}`}
    >
      <EditableProgramDayTab
        day={day}
        dayIndex={dayIndex}
        week={week}
        editMode={editMode}
        isEditing={isEditing}
        isWorkoutCompleted={isWorkoutCompleted}
        onAddNewBlock={onAddNewBlock}
        onAddExercise={onAddExercise}
        onRemoveBlock={onRemoveBlock}
        onRemoveExercise={onRemoveExercise}
        onUpdateExercise={onUpdateExercise}
        dragHandleProps={isEditing ? { ...attributes, ...listeners } : undefined}
      />
    </div>
  );
};
