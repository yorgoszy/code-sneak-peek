
import React from 'react';
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle } from "lucide-react";

interface WeekDaySelectorProps {
  weeks: any[];
  currentSelectedWeek: number;
  currentSelectedDay: number;
  mode: 'view' | 'start';
  isWorkoutCompleted: (weekNumber: number, dayNumber: number) => boolean;
  isWorkoutMissed: (weekNumber: number, dayNumber: number) => boolean;
  onWeekDaySelect: (weekIndex: number, dayIndex: number) => void;
}

export const WeekDaySelector: React.FC<WeekDaySelectorProps> = ({
  weeks,
  currentSelectedWeek,
  currentSelectedDay,
  mode,
  isWorkoutCompleted,
  isWorkoutMissed,
  onWeekDaySelect
}) => {
  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${weeks.length}, 1fr)` }}>
      {weeks.map((week, weekIndex) => (
        <div key={week.id} className="border border-gray-200 rounded-none">
          <div className="bg-gray-50 p-3 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">
              {week.name || `Εβδομάδα ${week.week_number}`}
            </h3>
          </div>
          
          <div className="p-3">
            <div className="space-y-2">
              {week.program_days?.map((day: any, dayIndex: number) => {
                const completed = isWorkoutCompleted(week.week_number, day.day_number);
                const missed = isWorkoutMissed(week.week_number, day.day_number);
                const isSelected = currentSelectedWeek === weekIndex && currentSelectedDay === dayIndex;
                
                return (
                  <Button
                    key={day.id}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => onWeekDaySelect(weekIndex, dayIndex)}
                    className={`w-full justify-start rounded-none flex items-center gap-2 ${
                      missed ? 'opacity-60 border-red-300' : ''
                    }`}
                  >
                    {day.name || `Ημέρα ${day.day_number}`}
                    {mode === 'view' && completed && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                    {mode === 'view' && missed && <XCircle className="w-4 h-4 text-red-500" />}
                    {mode === 'start' && missed && <XCircle className="w-4 h-4 text-red-500" />}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
