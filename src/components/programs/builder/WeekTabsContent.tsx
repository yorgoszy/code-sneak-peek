
import React from 'react';
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { SortableDay } from './SortableDay';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { Exercise, Week } from '../types';

interface WeekTabsContentProps {
  weeks: Week[];
  exercises: Exercise[];
  selectedUserId?: string;
  onAddDay: (weekId: string) => void;
  onRemoveWeek: (weekId: string) => void;
  onAddBlock: (weekId: string, dayId: string) => void;
  onRemoveDay: (weekId: string, dayId: string) => void;
  onDuplicateDay: (weekId: string, dayId: string) => void;
  onUpdateDayName: (weekId: string, dayId: string, name: string) => void;
  onUpdateDayTestDay: (weekId: string, dayId: string, isTestDay: boolean, testTypes: string[]) => void;
  onUpdateDayCompetitionDay: (weekId: string, dayId: string, isCompetitionDay: boolean) => void;
  onAddExercise: (weekId: string, dayId: string, blockId: string, exerciseId: string) => void;
  onRemoveBlock: (weekId: string, dayId: string, blockId: string) => void;
  onDuplicateBlock: (weekId: string, dayId: string, blockId: string) => void;
  onUpdateBlockName: (weekId: string, dayId: string, blockId: string, name: string) => void;
  onUpdateBlockTrainingType: (weekId: string, dayId: string, blockId: string, trainingType: string) => void;
  onUpdateBlockWorkoutFormat: (weekId: string, dayId: string, blockId: string, format: string) => void;
  onUpdateBlockWorkoutDuration: (weekId: string, dayId: string, blockId: string, duration: string) => void;
  onUpdateBlockSets: (weekId: string, dayId: string, blockId: string, sets: number) => void;
  onUpdateExercise: (weekId: string, dayId: string, blockId: string, exerciseId: string, field: string, value: any) => void;
  onRemoveExercise: (weekId: string, dayId: string, blockId: string, exerciseId: string) => void;
  onDuplicateExercise: (weekId: string, dayId: string, blockId: string, exerciseId: string) => void;
  onReorderDays: (weekId: string, oldIndex: number, newIndex: number) => void;
  onReorderBlocks: (weekId: string, dayId: string, oldIndex: number, newIndex: number) => void;
  onReorderExercises: (weekId: string, dayId: string, blockId: string, oldIndex: number, newIndex: number) => void;
  onPasteBlock: (weekId: string, dayId: string, clipboardBlock: any) => void;
}

export const WeekTabsContent: React.FC<WeekTabsContentProps> = ({
  weeks,
  exercises,
  selectedUserId,
  onAddDay,
  onRemoveWeek,
  onAddBlock,
  onRemoveDay,
  onDuplicateDay,
  onUpdateDayName,
  onUpdateDayTestDay,
  onUpdateDayCompetitionDay,
  onAddExercise,
  onRemoveBlock,
  onDuplicateBlock,
  onUpdateBlockName,
  onUpdateBlockTrainingType,
  onUpdateBlockWorkoutFormat,
  onUpdateBlockWorkoutDuration,
  onUpdateBlockSets,
  onUpdateExercise,
  onRemoveExercise,
  onDuplicateExercise,
  onReorderDays,
  onReorderBlocks,
  onReorderExercises,
  onPasteBlock
}) => {
  const handleDragEnd = (event: DragEndEvent, weekId: string) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const week = weeks.find(w => w.id === weekId);
      if (!week || !week.program_days) return;

      const oldIndex = week.program_days.findIndex(d => d.id === active.id);
      const newIndex = week.program_days.findIndex(d => d.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        onReorderDays(weekId, oldIndex, newIndex);
      }
    }
  };

  return (
    <>
      {weeks.map((week) => (
        <TabsContent key={week.id} value={week.id} className="mt-0">
            {week.program_days && week.program_days.length > 0 ? (
              <DndContext 
                collisionDetection={closestCenter} 
                onDragEnd={(event) => handleDragEnd(event, week.id)}
              >
                <SortableContext 
                  items={week.program_days.map(d => d.id)} 
                  strategy={rectSortingStrategy}
                >
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-gray-thin">
                    {week.program_days.map((day) => (
                      <SortableDay
                        key={day.id}
                        day={day}
                        exercises={exercises}
                        selectedUserId={selectedUserId}
                        onAddBlock={() => onAddBlock(week.id, day.id)}
                        onRemoveDay={() => onRemoveDay(week.id, day.id)}
                        onDuplicateDay={() => onDuplicateDay(week.id, day.id)}
                        onUpdateDayName={(name) => onUpdateDayName(week.id, day.id, name)}
                        onUpdateDayTestDay={(isTestDay, testTypes) => 
                          onUpdateDayTestDay(week.id, day.id, isTestDay, testTypes)
                        }
                        onUpdateBlockWorkoutFormat={(blockId, format) => onUpdateBlockWorkoutFormat(week.id, day.id, blockId, format)}
                        onUpdateBlockWorkoutDuration={(blockId, duration) => onUpdateBlockWorkoutDuration(week.id, day.id, blockId, duration)}
                        onUpdateBlockSets={(blockId, sets) => onUpdateBlockSets(week.id, day.id, blockId, sets)}
                        onUpdateDayCompetitionDay={(isCompetitionDay) =>
                          onUpdateDayCompetitionDay(week.id, day.id, isCompetitionDay)
                        }
                        onAddExercise={(blockId, exerciseId) =>
                          onAddExercise(week.id, day.id, blockId, exerciseId)
                        }
                        onRemoveBlock={(blockId) => onRemoveBlock(week.id, day.id, blockId)}
                        onDuplicateBlock={(blockId) => onDuplicateBlock(week.id, day.id, blockId)}
                        onUpdateBlockName={(blockId, name) => 
                          onUpdateBlockName(week.id, day.id, blockId, name)
                        }
                        onUpdateBlockTrainingType={(blockId, trainingType) => 
                          onUpdateBlockTrainingType(week.id, day.id, blockId, trainingType)
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
                        onPasteBlock={(clipboardBlock) => onPasteBlock(week.id, day.id, clipboardBlock)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <div className="text-center py-3 text-gray-500">
                <p className="text-xs">Δεν υπάρχουν ημέρες</p>
                <Button
                  onClick={() => onAddDay(week.id)}
                  size="sm"
                  className="rounded-none mt-2 h-5 px-1.5 text-[9px]"
                >
                  <Plus className="w-2.5 h-2.5 mr-0.5" />
                  Προσθήκη Ημέρας
                </Button>
              </div>
            )}
        </TabsContent>
      ))}
    </>
  );
};
