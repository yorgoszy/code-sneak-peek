
import React from 'react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle } from "lucide-react";
import { EditableProgramDayTab } from './EditableProgramDayTab';

interface EditableProgramWeekCardProps {
  week: any;
  weekIndex: number;
  editMode: boolean;
  isEditing: boolean;
  isWeekCompleted: (weekNumber: number, totalDaysInWeek: number) => boolean;
  isWorkoutCompleted: (weekNumber: number, dayNumber: number) => boolean;
  onDayDoubleClick: (week: any, day: any, event: React.MouseEvent) => void;
  onAddNewBlock: (dayId: string) => void;
}

export const EditableProgramWeekCard: React.FC<EditableProgramWeekCardProps> = ({
  week,
  weekIndex,
  editMode,
  isEditing,
  isWeekCompleted,
  isWorkoutCompleted,
  onDayDoubleClick,
  onAddNewBlock
}) => {
  const isCompleted = isWeekCompleted(week.week_number, week.program_days?.length || 0);

  return (
    <div key={week.id} className="border border-gray-200 rounded-none">
      <div className="bg-gray-50 p-3 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          {isCompleted && <CheckCircle className="w-5 h-5 text-[#00ffba]" />}
          {week.name || `Εβδομάδα ${week.week_number}`}
        </h3>
      </div>
      
      <div className="p-3">
        <Tabs defaultValue="0" className="w-full">
          <TabsList className="grid w-full rounded-none" style={{ gridTemplateColumns: `repeat(${week.program_days?.length || 1}, 1fr)` }}>
            {week.program_days?.map((day: any, dayIndex: number) => {
              const isDayCompleted = isWorkoutCompleted(week.week_number, day.day_number);
              
              return (
                <TabsTrigger 
                  key={day.id} 
                  value={dayIndex.toString()} 
                  className="rounded-none text-xs flex items-center gap-1"
                  onDoubleClick={(e) => onDayDoubleClick(week, day, e)}
                >
                  {isDayCompleted && <CheckCircle className="w-3 h-3 text-[#00ffba]" />}
                  {day.name || `Ημέρα ${day.day_number}`}
                </TabsTrigger>
              );
            })}
          </TabsList>

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
            />
          ))}
        </Tabs>
      </div>
    </div>
  );
};
