
import React from 'react';

const weekDays = ['Δε', 'Τρ', 'Τε', 'Πε', 'Πα', 'Σα', 'Κυ'];

export const CalendarWeekDays: React.FC = () => {
  return (
    <div className="grid grid-cols-7 border-b border-gray-200 w-full">
      {weekDays.map((day, idx) => (
        <div
          key={day}
          className={
            `w-full h-20 flex items-center justify-center border-gray-200
             text-sm font-medium text-gray-600 bg-white select-none
             ${idx < weekDays.length - 1 ? 'border-r' : ''} rounded-none`
          }
        >
          {day}
        </div>
      ))}
    </div>
  );
};
