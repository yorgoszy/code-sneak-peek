
import React from 'react';
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { SortableDay } from './SortableDay';
import { Exercise, Week } from '../types';

interface WeekTabsContentProps {
  weeks: Week[];
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
  onUpdateBlock: (weekId: string, dayId: string, blockId: string, field: string, value: any) => void;
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
  onRemoveWeek,
  onAddBlock,
  onRemoveDay,
  onDuplicateDay,
  onUpdateDayName,
  onAddExercise,
  onRemoveBlock,
  onDuplicateBlock,
  onUpdateBlockName,
  onUpdateBlock,
  onUpdateExercise,
  onRemoveExercise,
  onDuplicateExercise,
  onReorderDays,
  onReorderBlocks,
  onReorderExercises
}) => {
  const handleDragEnd = (weekId: string) => (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const week = weeks.find(w => w.id === weekId);
      if (!week?.program_days) return;

      const oldIndex = week.program_days.findIndex(day => day.id === active.id);
      const newIndex = week.program_days.findIndex(day => day.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        onReorderDays(weekId, oldIndex, newIndex);
      }
    }
  };

  return (
    <>
      {weeks.map((week) => (
        <TabsContent key={week.id} value={week.id} className="mt-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">{week.name}</h3>
              <div className="flex gap-2">
                <Button
                  onClick={() => onAddDay(week.id)}
                  size="sm"
                  className="rounded-none"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  +Day
                </Button>
              </div>
            </div>

            {week.program_days && week.program_days.length > 0 ? (
              <DndContext 
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd(week.id)}
              >
                <SortableContext 
                  items={week.program_days.map(day => day.id)}
                  strategy={rectSortingStrategy}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {week.program_days.map((day) => (
                      <SortableDay
                        key={day.id}
                        day={day}
                        exercises={exercises}
                        onAddBlock={() => onAddBlock(week.id, day.id)}
                        onRemoveDay={() => onRemoveDay(week.id, day.id)}
                        onDuplicateDay={() => onDuplicateDay(week.id, day.id)}
                        onUpdateDayName={(name) => onUpdateDayName(week.id, day.id, name)}
                        onAddExercise={(blockId, exerciseId) => 
                          onAddExercise(week.id, day.id, blockId, exerciseId)
                        }
                        onRemoveBlock={(blockId) => onRemoveBlock(week.id, day.id, blockId)}
                        onDuplicateBlock={(blockId) => onDuplicateBlock(week.id, day.id, blockId)}
                        onUpdateBlockName={(blockId, name) => 
                          onUpdateBlockName(week.id, day.id, blockId, name)
                        }
                        onUpdateBlock={(blockId, field, value) =>
                          onUpdateBlock(week.id, day.id, blockId, field, value)
                        }
                        onUpdateExercise={(blockId, exerciseId, field, value) =>
                          onUpdateExercise(week.id, day.id, blockId, exerciseId, field, value)
                        }
                        onRemoveExercise={(blockId, exerciseId) =>
                          onRemoveExercise(week.id, day.id, blockId, exerciseId)
                        }
                        onDuplicateExercise={(blockId, exerciseId) =>
                          onDuplicateExercise(week.id, day.id, blockId, exerciseId)
                        }
                        onReorderBlocks={(oldIndex, newIndex) =>
                          onReorderBlocks(week.id, day.id, oldIndex, newIndex)
                        }
                        onReorderExercises={(blockId, oldIndex, newIndex) =>
                          onReorderExercises(week.id, day.id, blockId, oldIndex, newIndex)
                        }
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Δεν υπάρχουν ημέρες σε αυτή την εβδομάδα</p>
                <Button
                  onClick={() => onAddDay(week.id)}
                  size="sm"
                  className="rounded-none mt-4"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Προσθήκη Ημέρας
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      ))}
    </>
  );
};
