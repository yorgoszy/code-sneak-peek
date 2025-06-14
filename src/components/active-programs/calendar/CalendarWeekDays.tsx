
import React from 'react';

// All week days should look visually the same in the header and match the calendar grid.
const weekDays = ['Δε', 'Τρ', 'Τε', 'Πε', 'Πα', 'Σα', 'Κυ'];

export const CalendarWeekDays: React.FC = () => {
  return (
    <div className="grid grid-cols-7 border-b border-gray-200" style={{ minWidth: 410 }}>
      {weekDays.map((day) => (
        <div
          key={day}
          className={`
            min-w-[28px] max-w-[38px] h-8 flex items-center justify-center
            py-0.5 px-0.5 text-center text-[11px] font-medium text-gray-600
            border-r border-gray-200 last:border-r-0 leading-tight rounded-none
          `}
          style={{ minWidth: 28, maxWidth: 38, height: 32 }}
        >
          {day}
        </div>
      ))}
    </div>
  );
};
