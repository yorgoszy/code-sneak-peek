
import React from 'react';

// All week days should look visually the same in the header and match the calendar grid.
const weekDays = ['Δε', 'Τρ', 'Τε', 'Πε', 'Πα', 'Σα', 'Κυ'];

export const CalendarWeekDays: React.FC = () => {
  return (
    <div className="grid grid-cols-7 border-b border-gray-200">
      {weekDays.map((day) => (
        <div
          key={day}
          className="py-0.5 px-0.5 text-center text-[10px] font-medium text-gray-600 border-r border-gray-200 last:border-r-0 leading-tight"
          style={{ minWidth: 22, maxWidth: 28 }} // Make all day name headers match calendar cell size
        >
          {day}
        </div>
      ))}
    </div>
  );
};
