
import React from 'react';
import { Tabs, TabsList } from "@/components/ui/tabs";
import { CheckCircle } from "lucide-react";
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { EditableProgramDayTab } from './EditableProgramDayTab';
import { SortableDay } from './SortableDay';

interface EditableProgramWeekCardProps {
  week: any;
  weekIndex: number;
  editMode: boolean;
  isEditing: boolean;
  isWeekCompleted: (weekNumber: number, totalDaysInWeek: number) => boolean;
  isWorkoutCompleted: (weekNumber: number, dayNumber: number) => boolean;
  onDayDoubleClick: (week: any, day: any, event: React.MouseEvent) => void;
  onAddNewBlock: (dayId: string) => void;
  onAddExercise: (blockId: string, exerciseId: string) => void;
  onRemoveBlock: (blockId: string) => void;
  onRemoveExercise: (exerciseId: string) => void;
  onUpdateExercise: (exerciseId: string, field: string, value: any) => void;
  onReorderDays?: (weekId: string, oldIndex: number, newIndex: number) => void;
}

export const EditableProgramWeekCard: React.FC<EditableProgramWeekCardProps> = ({
  week,
  weekIndex,
  editMode,
  isEditing,
  isWeekCompleted,
  isWorkoutCompleted,
  onDayDoubleClick,
  onAddNewBlock,
  onAddExercise,
  onRemoveBlock,
  onRemoveExercise,
  onUpdateExercise,
  onReorderDays
}) => {
  const isCompleted = isWeekCompleted(week.week_number, week.program_days?.length || 0);

  const handleDayDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id || !onReorderDays) return;
    
    const days = week.program_days || [];
    const oldIndex = days.findIndex((day: any) => day.id === active.id);
    const newIndex = days.findIndex((day: any) => day.id === over.id);
    
    if (oldIndex !== -1 && newIndex !== -1) {
      onReorderDays(week.id, oldIndex, newIndex);
    }
  };

  return (
    <div key={week.id} className="border border-gray-200 rounded-none">
      <div className="bg-gray-50 p-3 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          {isCompleted && <CheckCircle className="w-5 h-5 text-[#00ffba]" />}
          {week.name || `Εβδομάδα ${week.week_number}`}
        </h3>
      </div>
      
      <div className="p-3">
        <Tabs defaultValue="0" className="w-full">
          {editMode && isEditing ? (
            <DndContext collisionDetection={closestCenter} onDragEnd={handleDayDragEnd}>
              <SortableContext 
                items={(week.program_days || []).map((day: any) => day.id)} 
                strategy={horizontalListSortingStrategy}
              >
                <TabsList className="grid w-full rounded-none" style={{ gridTemplateColumns: `repeat(${week.program_days?.length || 1}, 1fr)` }}>
                  {week.program_days?.map((day: any, dayIndex: number) => {
                    const isDayCompleted = isWorkoutCompleted(week.week_number, day.day_number);
                    
                    return (
                      <SortableDay
                        key={day.id}
                        day={day}
                        dayIndex={dayIndex}
                        week={week}
                        isDayCompleted={isDayCompleted}
                        onDoubleClick={(e) => onDayDoubleClick(week, day, e)}
                        isEditing={isEditing}
                      />
                    );
                  })}
                </TabsList>
              </SortableContext>
            </DndContext>
          ) : (
            <TabsList className="grid w-full rounded-none" style={{ gridTemplateColumns: `repeat(${week.program_days?.length || 1}, 1fr)` }}>
              {week.program_days?.map((day: any, dayIndex: number) => {
                const isDayCompleted = isWorkoutCompleted(week.week_number, day.day_number);
                
                return (
                  <SortableDay
                    key={day.id}
                    day={day}
                    dayIndex={dayIndex}
                    week={week}
                    isDayCompleted={isDayCompleted}
                    onDoubleClick={(e) => onDayDoubleClick(week, day, e)}
                    isEditing={false}
                  />
                );
              })}
            </TabsList>
          )}

          {week.program_days?.map((day: any, dayIndex: number) => (
            <EditableProgramDayTab
              key={day.id}
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
            />
          ))}
        </Tabs>
      </div>
    </div>
  );
};
