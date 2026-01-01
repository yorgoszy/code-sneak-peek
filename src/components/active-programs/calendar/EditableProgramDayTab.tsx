
import React from 'react';
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Clock, Dumbbell, CheckCircle, Plus, FlaskConical, Trophy } from "lucide-react";
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

  const isTestDay = day.is_test_day === true;
  const isCompetitionDay = day.is_competition_day === true;

  // Αν είναι ημέρα τεστ ή αγώνα, εμφάνιση μόνο του label
  if (isTestDay || isCompetitionDay) {
    return (
      <TabsContent key={day.id} value={dayIndex.toString()} className="mt-0 flex-1 overflow-y-auto">
        <div className="bg-white rounded-none p-4 flex items-center justify-center min-h-[100px]">
          {isTestDay && (
            <div className="flex items-center gap-2 bg-purple-100 border-2 border-purple-500 px-6 py-4">
              <FlaskConical className="w-6 h-6 text-purple-600" />
              <span className="text-lg font-bold text-purple-700">ΗΜΕΡΑ ΤΕΣΤ</span>
            </div>
          )}
          {isCompetitionDay && (
            <div className="flex items-center gap-2 bg-orange-100 border-2 border-orange-500 px-6 py-4">
              <Trophy className="w-6 h-6 text-orange-600" />
              <span className="text-lg font-bold text-orange-700">ΗΜΕΡΑ ΑΓΩΝΑ</span>
            </div>
          )}
        </div>
      </TabsContent>
    );
  }

  return (
    <TabsContent key={day.id} value={dayIndex.toString()} className="mt-0 flex-1 overflow-y-auto">
      <div className="bg-white rounded-none p-1.5">
        {editMode && isEditing && (
          <div className="flex items-center justify-end mb-1">
            <Button
              onClick={() => onAddNewBlock(day.id)}
              size="sm"
              variant="outline"
              className="h-5 text-xs rounded-none py-0 px-2"
            >
              <Plus className="w-2 h-2 mr-1" />
              Block
            </Button>
          </div>
        )}

        <div className="space-y-1">
          {editMode && isEditing ? (
            <DndContext collisionDetection={closestCenter} onDragEnd={handleBlockDragEnd}>
              <SortableContext 
                items={(day.program_blocks || []).map((block: any) => block.id)} 
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-1">
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
            <div className="text-center py-4 text-gray-500">
              <p className="mb-2 text-xs">Δεν υπάρχουν blocks σε αυτή την ημέρα</p>
              <Button
                onClick={() => onAddNewBlock(day.id)}
                variant="outline"
                size="sm"
                className="rounded-none h-6 text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                Προσθήκη Block
              </Button>
            </div>
          )}
        </div>
      </div>
    </TabsContent>
  );
};
