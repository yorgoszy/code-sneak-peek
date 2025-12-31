
import React, { useState } from 'react';
import { Tabs, TabsList, TabsContent } from "@/components/ui/tabs";
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
  getDayRpe?: (weekNumber: number, dayNumber: number) => number | null;
  onDayDoubleClick: (week: any, day: any, event: React.MouseEvent) => void;
  onAddNewBlock: (dayId: string) => void;
  onAddExercise: (blockId: string, exerciseId: string) => void;
  onRemoveBlock: (blockId: string) => void;
  onRemoveExercise: (exerciseId: string) => void;
  onUpdateExercise: (exerciseId: string, field: string, value: any) => void;
  onReorderDays?: (weekId: string, oldIndex: number, newIndex: number) => void;
  getDayLabel?: (week: any, day: any) => string;
}

export const EditableProgramWeekCard: React.FC<EditableProgramWeekCardProps> = ({
  week,
  weekIndex,
  editMode,
  isEditing,
  isWeekCompleted,
  isWorkoutCompleted,
  getDayRpe,
  onDayDoubleClick,
  onAddNewBlock,
  onAddExercise,
  onRemoveBlock,
  onRemoveExercise,
  onUpdateExercise,
  onReorderDays,
  getDayLabel
}) => {
  const [activeTab, setActiveTab] = useState("0");
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
    <div 
      key={week.id} 
      className="border border-gray-200 rounded-none flex flex-col h-full min-w-0"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
        {/* Sticky header + tabs container */}
        <div className="sticky top-0 z-20 bg-white">
          {/* Week Header */}
          <div className="bg-gray-50 px-2 sm:px-3 py-1.5 sm:py-2 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 flex items-center gap-1 sm:gap-2 text-sm sm:text-base">
              {isCompleted && <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[#00ffba] flex-shrink-0" />}
              <span className="truncate">{week.name || `Εβδομάδα ${week.week_number}`}</span>
            </h3>
          </div>
          
          {/* Day Tabs - immediately below header */}
          {editMode && isEditing ? (
            <DndContext collisionDetection={closestCenter} onDragEnd={handleDayDragEnd}>
              <SortableContext 
                items={(week.program_days || []).map((day: any) => day.id)} 
                strategy={horizontalListSortingStrategy}
              >
                <TabsList className="flex w-full rounded-none gap-0 h-6 p-0 bg-white border-b border-gray-200">
                  {week.program_days?.map((day: any, dayIndex: number) => {
                    const isDayCompleted = isWorkoutCompleted(week.week_number, day.day_number);
                    const rpe = getDayRpe ? getDayRpe(week.week_number, day.day_number) : null;
                    const label = getDayLabel ? getDayLabel(week, day) : (day.name || `Ημέρα ${day.day_number}`);
                    
                    return (
                      <SortableDay
                        key={day.id}
                        day={day}
                        dayIndex={dayIndex}
                        week={week}
                        isDayCompleted={isDayCompleted}
                        rpe={rpe}
                        onDoubleClick={(e) => onDayDoubleClick(week, day, e)}
                        isEditing={isEditing}
                        displayName={label}
                      />
                    );
                  })}
                </TabsList>
              </SortableContext>
            </DndContext>
          ) : (
            <TabsList className="grid w-full rounded-none bg-white border-b border-gray-200" style={{ gridTemplateColumns: `repeat(${week.program_days?.length || 1}, 1fr)` }}>
              {week.program_days?.map((day: any, dayIndex: number) => {
                const isDayCompleted = isWorkoutCompleted(week.week_number, day.day_number);
                const rpe = getDayRpe ? getDayRpe(week.week_number, day.day_number) : null;
                const label = getDayLabel ? getDayLabel(week, day) : (day.name || `Ημέρα ${day.day_number}`);
                
                return (
                  <SortableDay
                    key={day.id}
                    day={day}
                    dayIndex={dayIndex}
                    week={week}
                    isDayCompleted={isDayCompleted}
                    rpe={rpe}
                    onDoubleClick={(e) => onDayDoubleClick(week, day, e)}
                    isEditing={false}
                    displayName={label}
                  />
                );
              })}
            </TabsList>
          )}
        </div>
        
        {/* Day Content - scrollable */}
        <div className="flex-1 overflow-y-auto">
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
              displayName={getDayLabel ? getDayLabel(week, day) : (day.name || `Ημέρα ${day.day_number}`)}
            />
          ))}
        </div>
      </Tabs>
    </div>
  );
};
