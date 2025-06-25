
import React from 'react';

interface WeekStructure {
  weekNumber: number;
  daysCount: number;
  name: string;
}

interface ProgramRequirementsProps {
  weekStructure: WeekStructure[];
  totalDays: number;
}

export const ProgramRequirements: React.FC<ProgramRequirementsProps> = ({
  weekStructure,
  totalDays
}) => {
  return (
    <div className="bg-gray-50 p-4 rounded-none">
      <h4 className="font-semibold text-gray-900 mb-3">Εβδομάδες: {weekStructure.length}</h4>
      <div className="space-y-2">
        {weekStructure.map((week, index) => (
          <div key={index} className="text-sm">
            <span className="font-medium">{week.name}:</span>
            <span className="ml-2 text-gray-600">
              {week.daysCount} ημέρες
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="text-sm font-medium text-blue-700">
          Συνολικές ημέρες: {totalDays}
        </div>
      </div>
    </div>
  );
};
