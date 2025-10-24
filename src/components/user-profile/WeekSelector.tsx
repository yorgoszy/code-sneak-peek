import React from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addWeeks, isSameWeek } from 'date-fns';
import { el } from 'date-fns/locale';

interface WeekSelectorProps {
  selectedWeekDate: Date;
  onWeekSelect: (weekStartDate: Date) => void;
}

export const WeekSelector: React.FC<WeekSelectorProps> = ({ selectedWeekDate, onWeekSelect }) => {
  // Βρίσκουμε όλες τις εβδομάδες του τρέχοντος μήνα
  const getWeeksInMonth = () => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    
    const weeks: Date[] = [];
    let currentWeekStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Ξεκινάει από Δευτέρα
    
    while (currentWeekStart <= monthEnd) {
      weeks.push(currentWeekStart);
      currentWeekStart = addWeeks(currentWeekStart, 1);
    }
    
    return weeks;
  };

  const weeks = getWeeksInMonth();

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {weeks.map((weekStart, index) => {
          const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
          const isSelected = isSameWeek(selectedWeekDate, weekStart, { weekStartsOn: 1 });
          
          return (
            <button
              key={index}
              onClick={() => onWeekSelect(weekStart)}
              className={`flex-shrink-0 px-4 py-2 border rounded-none text-sm transition-colors ${
                isSelected
                  ? 'bg-[#00ffba] text-black border-[#00ffba]'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-[#00ffba]'
              }`}
            >
              <div className="font-medium">
                Εβδομάδα {index + 1}
              </div>
              <div className="text-xs">
                {format(weekStart, 'd MMM', { locale: el })} - {format(weekEnd, 'd MMM', { locale: el })}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
