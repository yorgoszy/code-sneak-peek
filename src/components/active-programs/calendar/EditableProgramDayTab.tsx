import React from 'react';
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Clock, Dumbbell, CheckCircle, Plus, GripVertical } from "lucide-react";
import { EditableBlock } from './EditableBlock';
import { ExerciseSelector } from './ExerciseSelector';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';

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
  dragHandleProps?: any;
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
  dragHandleProps
}) => {
  const [exerciseSelectorOpen, setExerciseSelectorOpen] = React.useState(false);
  const [selectedBlockId, setSelectedBlockId] = React.useState<string>('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const handleAddExerciseClick = (blockId: string) => {
    setSelectedBlockId(blockId);
    setExerciseSelectorOpen(true);
  };

  const handleExerciseSelected = (exerciseId: string) => {
    if (selectedBlockId) {
      onAddExercise(selectedBlockId, exerciseId);
      setSelectedBlockId('');
    }
  };

  const handleDragEnd = (event: any) => {
    // Handle drag end for blocks within this day
    // This would need to be implemented in the parent component
  };

  return (
    <>
      <TabsContent key={day.id} value={dayIndex.toString()} className="mt-4">
        <div className="bg-white border border-gray-200 rounded-none p-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {isEditing && dragHandleProps && (
                <div
                  {...dragHandleProps}
                  className="cursor-move p-1"
                >
                  <GripVertical className="w-4 h-4 text-gray-400" />
                </div>
              )}
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
                    : editMode ? 'Λειτουργία επεξεργασίας' : 'Διπλό κλικ για έναρξη προπόνησης'
                  }
                </p>
              </div>
            </div>
            {day.estimated_duration_minutes && (
              <div className="flex items-center space-x-1 text-xs text-gray-600">
                <Clock className="h-3 w-3" />
                <span>{day.estimated_duration_minutes} λεπτά</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            {editMode && isEditing ? (
              <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext 
                  items={day.program_blocks?.map((block: any) => block.id) || []}
                  strategy={verticalListSortingStrategy}
                >
                  {day.program_blocks?.map((block: any) => (
                    <EditableBlock
                      key={block.id}
                      block={block}
                      onAddExercise={() => handleAddExerciseClick(block.id)}
                      onRemoveBlock={() => onRemoveBlock(block.id)}
                      onRemoveExercise={onRemoveExercise}
                      onUpdateExercise={onUpdateExercise}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            ) : (
              day.program_blocks?.map((block: any) => (
                <EditableBlock
                  key={block.id}
                  block={block}
                  onAddExercise={() => handleAddExerciseClick(block.id)}
                  onRemoveBlock={() => onRemoveBlock(block.id)}
                  onRemoveExercise={onRemoveExercise}
                  onUpdateExercise={onUpdateExercise}
                />
              ))
            )}
            
            {editMode && isEditing && (
              <div className="flex justify-center pt-2">
                <Button
                  onClick={() => onAddNewBlock(day.id)}
                  size="sm"
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

      <ExerciseSelector
        isOpen={exerciseSelectorOpen}
        onClose={() => {
          setExerciseSelectorOpen(false);
          setSelectedBlockId('');
        }}
        onSelectExercise={handleExerciseSelected}
      />
    </>
  );
};
