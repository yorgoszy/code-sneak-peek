
import React from 'react';

interface CalendarStatsProps {
  stats: {
    totalPrograms: number;
    activeToday: number;
    completedToday: number;
  };
}

export const CalendarStats: React.FC<CalendarStatsProps> = ({ stats }) => {
  return (
    <div className="space-y-2">
      <div className="bg-gray-50 p-2 rounded-none">
        <div className="font-semibold text-[#00ffba]">{stats.activeToday}</div>
        <div className="text-gray-600 text-xs">Ενεργές σήμερα</div>
      </div>
      <div className="bg-gray-50 p-2 rounded-none">
        <div className="font-semibold text-green-600">{stats.completedToday}</div>
        <div className="text-gray-600 text-xs">Ολοκληρωμένες</div>
      </div>
      <div className="bg-gray-50 p-2 rounded-none">
        <div className="font-semibold text-blue-600">{stats.totalPrograms}</div>
        <div className="text-gray-600 text-xs">Σύνολο Προγραμμάτων</div>
      </div>
    </div>
  );
};
