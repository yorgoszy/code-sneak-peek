
import React from 'react';
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { DayCard } from './DayCard';
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
  onUpdateExercise,
  onRemoveExercise,
  onDuplicateExercise,
  onReorderDays,
  onReorderBlocks,
  onReorderExercises
}) => {
  return (
    <>
      {weeks.map((week) => (
        <TabsContent key={week.id} value={week.id} className="mt-4 md:mt-6">
          <div className="space-y-3 md:space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h3 className="text-base md:text-lg font-semibold">{week.name}</h3>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  onClick={() => onAddDay(week.id)}
                  size="sm"
                  className="rounded-none flex-1 sm:flex-none text-xs md:text-sm"
                >
                  <Plus className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                  <span className="hidden sm:inline">+Day</span>
                  <span className="sm:hidden">+ Ημέρα</span>
                </Button>
              </div>
            </div>

            {week.program_days && week.program_days.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
                {week.program_days.map((day) => (
                  <DayCard
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
            ) : (
              <div className="text-center py-6 md:py-8 text-gray-500">
                <p className="text-sm md:text-base">Δεν υπάρχουν ημέρες σε αυτή την εβδομάδα</p>
                <Button
                  onClick={() => onAddDay(week.id)}
                  size="sm"
                  className="rounded-none mt-3 md:mt-4 text-xs md:text-sm"
                >
                  <Plus className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
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
