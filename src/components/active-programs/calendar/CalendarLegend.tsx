
import React from 'react';

export const CalendarLegend: React.FC = () => {
  return (
    <div className="text-xs text-gray-500 space-y-1">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
        <span>Προγραμματισμένες</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-[#00ffba] rounded-full"></div>
        <span>Ολοκληρωμένες</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
        <span>Χαμένες</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 bg-yellow-300 rounded-none border border-yellow-600"></div>
        <span>Σήμερα</span>
      </div>
    </div>
  );
};
