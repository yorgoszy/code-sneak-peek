
import React from 'react';

interface SelectionProgressProps {
  selectedCount: number;
  totalDays: number;
}

export const SelectionProgress: React.FC<SelectionProgressProps> = ({
  selectedCount,
  totalDays
}) => {
  return (
    <div className="bg-white border border-gray-200 p-3 rounded-none">
      <div className="text-sm text-gray-600 mb-2">Πρόοδος Επιλογής</div>
      <div className="text-lg font-semibold text-gray-900">
        Επιλεγμένες ημερομηνίες: {selectedCount} / {totalDays}
      </div>
      <div className="w-full bg-gray-200 rounded-none h-2 mt-2">
        <div 
          className="bg-[#00ffba] h-2 rounded-none transition-all duration-300"
          style={{ width: `${(selectedCount / totalDays) * 100}%` }}
        />
      </div>
    </div>
  );
};
