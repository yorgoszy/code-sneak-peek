
import React from 'react';
import { format, parseISO } from "date-fns";

interface SelectedDatesDisplayProps {
  selectedDatesAsStrings: string[];
}

export const SelectedDatesDisplay: React.FC<SelectedDatesDisplayProps> = ({
  selectedDatesAsStrings
}) => {
  if (selectedDatesAsStrings.length === 0) return null;

  return (
    <div>
      <h4 className="font-medium mb-2">Επιλεγμένες Ημερομηνίες:</h4>
      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
        {selectedDatesAsStrings.map((date, index) => (
          <div 
            key={date} 
            className="text-xs p-2 rounded-none border bg-gray-50 border-gray-200"
          >
            <span>{format(parseISO(date), 'dd/MM/yyyy')}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
