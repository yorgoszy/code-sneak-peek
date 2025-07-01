
import React from 'react';
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Clock, Dumbbell, CheckCircle, Plus } from "lucide-react";
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ExerciseBlock } from "@/components/user-profile/daily-program/ExerciseBlock";
import { EditableBlock } from './EditableBlock';

interface EditableProgramDayTabProps {
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

export const EditableProgramDayTab: React.FC<EditableProgramDayTabProps> = ({
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
  const handleBlockDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;
    
    // Handle block reordering logic here if needed
    console.log('Block reorder:', active.id, 'to', over.id);
  };

  return (
    <TabsContent key={day.id} value={dayIndex.toString()} className="mt-4">
      <div className="bg-white border border-gray-200 rounded-none p-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-sm font-semibold text-gray-900 flex items-center space-x-2">
              <Dumbbell className="h-4 w-4" />
              <span>{day.name || `Ημέρα ${day.day_number}`}</span>
              {isWorkoutCompleted(week.week_number, day.day_number) && (
                <CheckCircle className="w-4 h-4 text-[#00ffba]" />
              )}
            </h4>
            <p className="text-xs text-gray-500 mt-1">
              {isWorkoutCompleted(week.week_number, day.day_number) 
                ? 'Προπόνηση ολοκληρωμένη' 
                : editMode 
                  ? 'Λειτουργία επεξεργασίας'
                  : 'Διπλό κλικ για έναρξη προπόνησης'
              }
            </p>
          </div>
          <div className="flex items-center gap-2">
            {day.estimated_duration_minutes && (
              <div className="flex items-center space-x-1 text-xs text-gray-600">
                <Clock className="h-3 w-3" />
                <span>{day.estimated_duration_minutes} λεπτά</span>
              </div>
            )}
            {editMode && isEditing && (
              <Button
                onClick={() => onAddNewBlock(day.id)}
                size="sm"
                variant="outline"
                className="h-6 text-xs rounded-none"
              >
                <Plus className="w-3 h-3 mr-1" />
                Block
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          {editMode && isEditing ? (
            <DndContext collisionDetection={closestCenter} onDragEnd={handleBlockDragEnd}>
              <SortableContext 
                items={(day.program_blocks || []).map((block: any) => block.id)} 
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {(day.program_blocks || []).map((block: any) => (
                    <EditableBlock
                      key={block.id}
                      block={block}
                      onAddExercise={onAddExercise}
                      onRemoveBlock={onRemoveBlock}
                      onRemoveExercise={onRemoveExercise}
                      onUpdateExercise={onUpdateExercise}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <ExerciseBlock 
              blocks={day.program_blocks} 
              viewOnly={!isEditing}
            />
          )}
          
          {(day.program_blocks || []).length === 0 && editMode && isEditing && (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-2">Δεν υπάρχουν blocks σε αυτή την ημέρα</p>
              <Button
                onClick={() => onAddNewBlock(day.id)}
                variant="outline"
                className="rounded-none"
              >
                <Plus className="w-4 h-4 mr-2" />
                Προσθήκη Block
              </Button>
            </div>
          )}
        </div>
      </div>
    </TabsContent>
  );
};
