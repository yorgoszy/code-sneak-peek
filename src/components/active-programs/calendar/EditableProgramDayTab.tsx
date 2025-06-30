
import React from 'react';
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Clock, Dumbbell, CheckCircle, Plus } from "lucide-react";
import { ExerciseBlock } from "@/components/user-profile/daily-program/ExerciseBlock";

interface EditableProgramDayTabProps {
  day: any;
  dayIndex: number;
  week: any;
  editMode: boolean;
  isEditing: boolean;
  isWorkoutCompleted: (weekNumber: number, dayNumber: number) => boolean;
  onAddNewBlock: (dayId: string) => void;
}

export const EditableProgramDayTab: React.FC<EditableProgramDayTabProps> = ({
  day,
  dayIndex,
  week,
  editMode,
  isEditing,
  isWorkoutCompleted,
  onAddNewBlock
}) => {
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
          <ExerciseBlock 
            blocks={day.program_blocks} 
            viewOnly={!isEditing} 
            editMode={isEditing}
          />
        </div>
      </div>
    </TabsContent>
  );
};
