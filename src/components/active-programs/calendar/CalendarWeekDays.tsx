import React from 'react';

const weekDays = ['Δε', 'Τρ', 'Τε', 'Πε', 'Πα', 'Σα', 'Κυ'];

export const CalendarWeekDays: React.FC = () => {
  return (
    <div className="grid grid-cols-7 border-b border-gray-200">
      {weekDays.map((day) => (
        <div key={day} className="py-1 px-0.5 text-center text-xs font-medium text-gray-600 border-r border-gray-200 last:border-r-0">
          {day}
        </div>
      ))}
    </div>
  );
};
