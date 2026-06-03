
import React, { useState } from 'react';
import { Tabs, TabsList, TabsContent } from "@/components/ui/tabs";
import { CheckCircle, Copy, ClipboardPaste } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { EditableProgramDayTab } from './EditableProgramDayTab';
import { SortableDay } from './SortableDay';
import { useTranslation } from 'react-i18next';
import { useProgramClipboard } from "@/contexts/ProgramClipboardContext";

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
  onUpdateBlockTrainingType?: (blockId: string, trainingType: string) => void;
  onUpdateBlockFormat?: (blockId: string, format: string) => void;
  onUpdateBlockDuration?: (blockId: string, duration: string) => void;
  onUpdateBlockSets?: (blockId: string, sets: number) => void;
  onPasteBlock?: (dayId: string, block: any) => void;
  onPasteDay?: (dayId: string, day: any) => void;
  onPasteWeek?: (weekId: string, week: any) => void;
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
  onUpdateBlockTrainingType,
  onUpdateBlockFormat,
  onUpdateBlockDuration,
  onUpdateBlockSets,
  onPasteBlock,
  onPasteDay,
  onPasteWeek,
  getDayLabel
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("0");
  const isCompleted = isWeekCompleted(week.week_number, week.program_days?.length || 0);
  const { copyWeek, paste, hasWeek, clearClipboard } = useProgramClipboard();

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

  const handleCopyWeek = () => copyWeek(week);
  const handlePasteWeek = () => {
    const c = paste();
    if (c?.type === 'week' && onPasteWeek) {
      onPasteWeek(week.id, c.data);
      clearClipboard();
    }
  };

  return (
    <div 
      key={week.id} 
      className="border border-gray-200 rounded-none flex flex-col h-full min-w-0"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
        {/* Header + tabs container */}
        <div className="z-20 bg-white">
          {/* Week Header */}
          <div className="bg-gray-50 px-2 sm:px-3 py-1.5 sm:py-2 border-b border-gray-200 flex items-center justify-between gap-2">
            <h3 className="font-semibold text-gray-900 flex items-center gap-1 sm:gap-2 text-sm sm:text-base min-w-0">
              {isCompleted && <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[#00ffba] flex-shrink-0" />}
              <span className="truncate">{week.name || `${t('programs.weekShort', 'Wk')} ${week.week_number}`}</span>
            </h3>
            {editMode && isEditing && (
              <div className="flex items-center gap-0.5 flex-shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 rounded-none"
                  title="Αντιγραφή εβδομάδας"
                  onClick={handleCopyWeek}
                >
                  <Copy className="w-3 h-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 rounded-none disabled:opacity-30"
                  title={hasWeek ? "Επικόλληση εβδομάδας" : "Δεν υπάρχει εβδομάδα στο clipboard"}
                  disabled={!hasWeek}
                  onClick={handlePasteWeek}
                >
                  <ClipboardPaste className="w-3 h-3" />
                </Button>
              </div>
            )}
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
                    const label = getDayLabel ? getDayLabel(week, day) : (day.name || `${t('programs.dayShort', 'Day')} ${day.day_number}`);
                    
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
                const label = getDayLabel ? getDayLabel(week, day) : (day.name || `${t('programs.dayShort', 'Day')} ${day.day_number}`);
                
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
              onUpdateBlockTrainingType={onUpdateBlockTrainingType}
              onUpdateBlockFormat={onUpdateBlockFormat}
              onUpdateBlockDuration={onUpdateBlockDuration}
              onUpdateBlockSets={onUpdateBlockSets}
              onPasteBlock={onPasteBlock}
              onPasteDay={onPasteDay}
              displayName={getDayLabel ? getDayLabel(week, day) : (day.name || `${t('programs.dayShort', 'Day')} ${day.day_number}`)}
            />
          ))}
        </div>
      </Tabs>
    </div>
  );
};
