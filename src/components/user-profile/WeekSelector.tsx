import React from 'react';
import { startOfMonth, endOfMonth, eachWeekOfInterval, startOfWeek, endOfWeek, format, isSameWeek } from 'date-fns';
import { el } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface WeekSelectorProps {
  selectedDate: Date;
  onSelectWeek: (date: Date) => void;
}

export const WeekSelector: React.FC<WeekSelectorProps> = ({ selectedDate, onSelectWeek }) => {
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);

  // Παίρνουμε όλες τις εβδομάδες του μήνα
  const weeks = eachWeekOfInterval(
    { start: monthStart, end: monthEnd },
    { locale: el }
  );

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {weeks.map((weekStart, index) => {
          const weekEnd = endOfWeek(weekStart, { locale: el });
          const isSelected = isSameWeek(selectedDate, weekStart, { locale: el });
          
          return (
            <button
              key={index}
              onClick={() => onSelectWeek(weekStart)}
              className={cn(
                "flex-shrink-0 px-4 py-2 border rounded-none transition-colors",
                isSelected
                  ? "bg-[#00ffba] text-black border-[#00ffba]"
                  : "bg-white text-gray-700 border-gray-300 hover:border-[#00ffba]"
              )}
            >
              <div className="text-xs font-medium">
                Εβδομάδα {index + 1}
              </div>
              <div className="text-xs text-gray-500">
                {format(weekStart, 'd', { locale: el })} - {format(weekEnd, 'd MMM', { locale: el })}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
