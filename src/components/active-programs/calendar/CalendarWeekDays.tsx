
import React from 'react';

const weekDays = ['Δε', 'Τρ', 'Τε', 'Πε', 'Πα', 'Σα', 'Κυ'];

export const CalendarWeekDays: React.FC = () => {
  return (
    <div className="grid grid-cols-7 border-b border-gray-200">
      {weekDays.map((day) => (
        <div
          key={day}
          className="
            min-w-[64px] max-w-[100px] h-20
            flex items-center justify-center
            border-r border-gray-200 last:border-r-0
            text-sm font-medium text-gray-600
            bg-white select-none
          "
          style={{ flex: '1 0 64px' }}
        >
          {day}
        </div>
      ))}
    </div>
  );
};

