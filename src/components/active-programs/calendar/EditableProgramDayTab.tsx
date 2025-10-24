
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
  displayName?: string;
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
  onUpdateExercise,
  displayName
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
        {editMode && isEditing && (
          <div className="flex items-center justify-end mb-3">
            <Button
              onClick={() => onAddNewBlock(day.id)}
              size="sm"
              variant="outline"
              className="h-6 text-xs rounded-none"
            >
              <Plus className="w-3 h-3 mr-1" />
              Block
            </Button>
          </div>
        )}

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
