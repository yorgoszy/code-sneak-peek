
import React from 'react';
import { format } from "date-fns";
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface CalendarCellProps {
  day: Date;
  currentDate: Date;
  programs: EnrichedAssignment[];
  allCompletions: any[];
  onDayClick: (day: Date) => void;
}

export const CalendarCell: React.FC<CalendarCellProps> = ({
  day,
  currentDate,
  programs,
  allCompletions,
  onDayClick
}) => {
  const dayPrograms = programs.filter(program => {
    if (!program.training_dates) return false;
    return program.training_dates.some((dateStr: string) => {
      const programDate = new Date(dateStr);
      return programDate.toDateString() === day.toDateString();
    });
  });

  return (
    <div
      className={`
        text-xs p-1 min-h-[32px] flex flex-col cursor-pointer hover:bg-gray-700 transition-colors
        ${day.getMonth() !== currentDate.getMonth() ? 'text-gray-600' : 'text-white'}
        ${new Date().toDateString() === day.toDateString() ? 'bg-[#00ffba] text-black font-bold' : 'bg-gray-800'}
      `}
      onClick={() => onDayClick(day)}
    >
      <span className="text-xs leading-none mb-1">{day.getDate()}</span>
      {/* Program indicators */}
      <div className="flex flex-wrap gap-px">
        {dayPrograms
          .slice(0, 4)
          .map((program, index) => {
            const dayString = format(day, 'yyyy-MM-dd');
            const completion = allCompletions.find(c => 
              c.assignment_id === program.id && 
              c.scheduled_date === dayString
            );
            return (
              <div
                key={`${program.id}-${index}`}
                className={`w-2 h-2 ${completion ? 'bg-green-400' : 'bg-orange-400'}`}
                title={program.programs?.name || 'Program'}
              />
            );
          })}
        {dayPrograms.length > 4 && (
          <div className="w-2 h-2 bg-blue-400" title={`+${dayPrograms.length - 4} ακόμη`} />
        )}
      </div>
    </div>
  );
};
