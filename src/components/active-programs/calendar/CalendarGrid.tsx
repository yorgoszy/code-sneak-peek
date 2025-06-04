
import React from 'react';
import { CalendarDay } from './CalendarDay';
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface CalendarGridProps {
  days: Date[];
  currentDate: Date;
  programs: EnrichedAssignment[];
  allCompletions: any[];
  onRefresh?: () => void;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  days,
  currentDate,
  programs,
  allCompletions,
  onRefresh
}) => {
  return (
    <>
      <div className="grid grid-cols-7 gap-1 mb-4">
        {['Κυρ', 'Δευ', 'Τρι', 'Τετ', 'Πεμ', 'Παρ', 'Σαβ'].map((day) => (
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
          />
        ))}
      </div>
    </>
  );
};
