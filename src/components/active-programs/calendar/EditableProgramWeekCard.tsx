
import React from 'react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle } from "lucide-react";
import { SortableDay } from './SortableDay';
import { EditableProgramDayTab } from './EditableProgramDayTab';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';

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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const handleDayDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over?.id && onReorderDays) {
      const oldIndex = week.program_days.findIndex((day: any) => day.id === active.id);
      const newIndex = week.program_days.findIndex((day: any) => day.id === over.id);
      
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
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDayDragEnd}
            >
              <SortableContext 
                items={week.program_days?.map((day: any) => day.id) || []}
                strategy={horizontalListSortingStrategy}
              >
                <TabsList className="grid w-full rounded-none" style={{ gridTemplateColumns: `repeat(${week.program_days?.length || 1}, 1fr)` }}>
                  {week.program_days?.map((day: any, dayIndex: number) => {
                    const isDayCompleted = isWorkoutCompleted(week.week_number, day.day_number);
                    
                    return (
                      <TabsTrigger 
                        key={day.id} 
                        value={dayIndex.toString()} 
                        className="rounded-none text-xs flex items-center gap-1"
                        onDoubleClick={(e) => onDayDoubleClick(week, day, e)}
                      >
                        {isDayCompleted && <CheckCircle className="w-3 h-3 text-[#00ffba]" />}
                        {day.name || `Ημέρα ${day.day_number}`}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                {week.program_days?.map((day: any, dayIndex: number) => (
                  <SortableDay
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
              </SortableContext>
            </DndContext>
          ) : (
            <>
              <TabsList className="grid w-full rounded-none" style={{ gridTemplateColumns: `repeat(${week.program_days?.length || 1}, 1fr)` }}>
                {week.program_days?.map((day: any, dayIndex: number) => {
                  const isDayCompleted = isWorkoutCompleted(week.week_number, day.day_number);
                  
                  return (
                    <TabsTrigger 
                      key={day.id} 
                      value={dayIndex.toString()} 
                      className="rounded-none text-xs flex items-center gap-1"
                      onDoubleClick={(e) => onDayDoubleClick(week, day, e)}
                    >
                      {isDayCompleted && <CheckCircle className="w-3 h-3 text-[#00ffba]" />}
                      {day.name || `Ημέρα ${day.day_number}`}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

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
            </>
          )}
        </Tabs>
      </div>
    </div>
  );
};
