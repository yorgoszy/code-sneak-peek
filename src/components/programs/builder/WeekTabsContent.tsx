
import React from 'react';
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableDay } from './SortableDay';
import { Exercise } from '../types';

interface WeekTabsContentProps {
  weeks: any[];
  exercises: Exercise[];
  onAddDay: (weekId: string) => void;
  onRemoveWeek: (weekId: string) => void;
  onAddBlock: (weekId: string, dayId: string) => void;
  onRemoveDay: (weekId: string, dayId: string) => void;
  onDuplicateDay: (weekId: string, dayId: string) => void;
  onUpdateDayName: (weekId: string, dayId: string, name: string) => void;
  onAddExercise: (weekId: string, dayId: string, blockId: string, exerciseId: string) => void;
  onRemoveBlock: (weekId: string, dayId: string, blockId: string) => void;
  onDuplicateBlock: (weekId: string, dayId: string, blockId: string) => void;
  onUpdateBlockName: (weekId: string, dayId: string, blockId: string, name: string) => void;
  onUpdateExercise: (weekId: string, dayId: string, blockId: string, exerciseId: string, field: string, value: any) => void;
  onRemoveExercise: (weekId: string, dayId: string, blockId: string, exerciseId: string) => void;
  onDuplicateExercise: (weekId: string, dayId: string, blockId: string, exerciseId: string) => void;
  onReorderDays: (weekId: string, oldIndex: number, newIndex: number) => void;
  onReorderBlocks: (weekId: string, dayId: string, oldIndex: number, newIndex: number) => void;
  onReorderExercises: (weekId: string, dayId: string, blockId: string, oldIndex: number, newIndex: number) => void;
}

export const WeekTabsContent: React.FC<WeekTabsContentProps> = ({
  weeks,
  exercises,
  onAddDay,
  onAddBlock,
  onRemoveDay,
  onDuplicateDay,
  onUpdateDayName,
  onAddExercise,
  onRemoveBlock,
  onDuplicateBlock,
  onUpdateBlockName,
  onUpdateExercise,
  onRemoveExercise,
  onDuplicateExercise,
  onReorderDays,
  onReorderBlocks,
  onReorderExercises
}) => {
  const handleDragEnd = (weekId: string) => (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const week = weeks.find(w => w.id === weekId);
      if (week) {
        const oldIndex = week.days.findIndex((day: any) => day.id === active.id);
        const newIndex = week.days.findIndex((day: any) => day.id === over.id);
        onReorderDays(weekId, oldIndex, newIndex);
      }
    }
  };

  return (
    <>
      {weeks.map((week) => (
        <TabsContent key={week.id} value={week.id} className="mt-4">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                {week.name} - Ημέρες Προπόνησης
              </h3>
              <Button
                onClick={() => onAddDay(week.id)}
                className="rounded-none w-full sm:w-auto"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Προσθήκη Ημέρας
              </Button>
            </div>

            {week.days && week.days.length > 0 ? (
              <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd(week.id)}>
                <SortableContext items={week.days.map((d: any) => d.id)} strategy={horizontalListSortingStrategy}>
                  {/* Mobile: Stack days vertically */}
                  <div className="block lg:hidden space-y-4">
                    {week.days.map((day: any) => (
                      <div key={day.id} className="w-full">
                        <SortableDay
                          day={day}
                          exercises={exercises}
                          onAddBlock={() => onAddBlock(week.id, day.id)}
                          onRemoveDay={() => onRemoveDay(week.id, day.id)}
                          onDuplicateDay={() => onDuplicateDay(week.id, day.id)}
                          onUpdateDayName={(name) => onUpdateDayName(week.id, day.id, name)}
                          onAddExercise={(blockId, exerciseId) => onAddExercise(week.id, day.id, blockId, exerciseId)}
                          onRemoveBlock={(blockId) => onRemoveBlock(week.id, day.id, blockId)}
                          onDuplicateBlock={(blockId) => onDuplicateBlock(week.id, day.id, blockId)}
                          onUpdateBlockName={(blockId, name) => onUpdateBlockName(week.id, day.id, blockId, name)}
                          onUpdateExercise={(blockId, exerciseId, field, value) => 
                            onUpdateExercise(week.id, day.id, blockId, exerciseId, field, value)
                          }
                          onRemoveExercise={(blockId, exerciseId) => onRemoveExercise(week.id, day.id, blockId, exerciseId)}
                          onDuplicateExercise={(blockId, exerciseId) => onDuplicateExercise(week.id, day.id, blockId, exerciseId)}
                          onReorderBlocks={(oldIndex, newIndex) => onReorderBlocks(week.id, day.id, oldIndex, newIndex)}
                          onReorderExercises={(blockId, oldIndex, newIndex) => 
                            onReorderExercises(week.id, day.id, blockId, oldIndex, newIndex)
                          }
                        />
                      </div>
                    ))}
                  </div>

                  {/* Desktop: Horizontal layout with scroll */}
                  <div className="hidden lg:block">
                    <div className="flex gap-4 overflow-x-auto pb-4" style={{minHeight: '600px'}}>
                      {week.days.map((day: any) => (
                        <div key={day.id} className="flex-shrink-0" style={{width: '320px'}}>
                          <SortableDay
                            day={day}
                            exercises={exercises}
                            onAddBlock={() => onAddBlock(week.id, day.id)}
                            onRemoveDay={() => onRemoveDay(week.id, day.id)}
                            onDuplicateDay={() => onDuplicateDay(week.id, day.id)}
                            onUpdateDayName={(name) => onUpdateDayName(week.id, day.id, name)}
                            onAddExercise={(blockId, exerciseId) => onAddExercise(week.id, day.id, blockId, exerciseId)}
                            onRemoveBlock={(blockId) => onRemoveBlock(week.id, day.id, blockId)}
                            onDuplicateBlock={(blockId) => onDuplicateBlock(week.id, day.id, blockId)}
                            onUpdateBlockName={(blockId, name) => onUpdateBlockName(week.id, day.id, blockId, name)}
                            onUpdateExercise={(blockId, exerciseId, field, value) => 
                              onUpdateExercise(week.id, day.id, blockId, exerciseId, field, value)
                            }
                            onRemoveExercise={(blockId, exerciseId) => onRemoveExercise(week.id, day.id, blockId, exerciseId)}
                            onDuplicateExercise={(blockId, exerciseId) => onDuplicateExercise(week.id, day.id, blockId, exerciseId)}
                            onReorderBlocks={(oldIndex, newIndex) => onReorderBlocks(week.id, day.id, oldIndex, newIndex)}
                            onReorderExercises={(blockId, oldIndex, newIndex) => 
                              onReorderExercises(week.id, day.id, blockId, oldIndex, newIndex)
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-none">
                <p className="text-sm sm:text-base">Δεν υπάρχουν ημέρες σε αυτή την εβδομάδα</p>
                <p className="text-xs sm:text-sm mt-1">Κάντε κλικ στο κουμπί "Προσθήκη Ημέρας" για να ξεκινήσετε</p>
              </div>
            )}
          </div>
        </TabsContent>
      ))}
    </>
  );
};
