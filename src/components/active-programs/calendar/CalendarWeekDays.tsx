
import React from 'react';

const weekDays = ['Δε', 'Τρ', 'Τε', 'Πε', 'Πα', 'Σα', 'Κυ'];

export const CalendarWeekDays: React.FC = () => {
  return (
    <div className="grid grid-cols-7 border-b border-gray-200 w-full">
      {weekDays.map((day, idx) => (
        <div
          key={day}
          className={
            `
            w-full min-w-0
            h-12 md:h-20
            flex items-center justify-center border-gray-200
            text-xs md:text-sm font-medium text-gray-600 bg-white select-none
            ${idx < weekDays.length - 1 ? 'border-r' : ''} rounded-none
            `
          }
          style={{
            // Identical responsive styling as day cells
          }}
        >
          {day}
        </div>
      ))}
    </div>
  );
};
