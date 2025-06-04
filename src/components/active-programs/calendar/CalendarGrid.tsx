
import React from 'react';
import { CalendarDay } from './CalendarDay';
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface CalendarGridProps {
  days: Date[];
  currentDate: Date;
  programs: EnrichedAssignment[];
  allCompletions: any[];
  onRefresh?: () => void;
  isCompactMode?: boolean;
  containerId?: string;
  onProgramClick?: (program: EnrichedAssignment, date: Date, status: string) => void;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  days,
  currentDate,
  programs,
  allCompletions,
  onRefresh,
  isCompactMode = false,
  containerId,
  onProgramClick
}) => {
  const dayLabels = ['Δευ', 'Τρι', 'Τετ', 'Πεμ', 'Παρ', 'Σαβ', 'Κυρ'];
  
  if (isCompactMode) {
    return (
      <div className="h-full flex flex-col">
        <div className="grid grid-cols-7 gap-0.5 mb-1 flex-shrink-0">
          {dayLabels.map((day) => (
            <div key={day} className="p-0.5 text-center font-medium text-gray-600 text-xs">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-0.5 flex-1 min-h-0">
          {days.map((day) => (
            <CalendarDay
              key={day.toISOString()}
              day={day}
              currentDate={currentDate}
              programs={programs}
              allCompletions={allCompletions}
              onRefresh={onRefresh}
              isCompactMode={true}
              containerId={containerId}
              onProgramClick={onProgramClick}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-7 gap-1 mb-4">
        {dayLabels.map((day) => (
          <div key={day} className="p-2 text-center font-medium text-gray-600 text-sm">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => (
          <CalendarDay
            key={day.toISOString()}
            day={day}
            currentDate={currentDate}
            programs={programs}
            allCompletions={allCompletions}
            onRefresh={onRefresh}
            onProgramClick={onProgramClick}
          />
        ))}
      </div>
    </>
  );
};
