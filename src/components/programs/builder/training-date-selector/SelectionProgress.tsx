
import React from 'react';
import { Button } from "@/components/ui/button";
import { SelectionProgressProps } from './types';

export const SelectionProgress: React.FC<SelectionProgressProps> = ({
  selectedDatesLength,
  totalRequiredDays,
  onClearAll
}) => {
  return (
    <div className="bg-green-50 border border-green-200 rounded-none p-4">
      <h4 className="font-medium text-green-800 mb-2">Πρόοδος Επιλογής</h4>
      <div className="space-y-2 text-sm">
        <p><strong>Επιλεγμένες ημερομηνίες:</strong> {selectedDatesLength} / {totalRequiredDays}</p>
        <div className="w-full bg-gray-200 rounded-none h-2">
          <div 
            className="bg-[#00ffba] h-2 rounded-none transition-all duration-300" 
            style={{ width: `${totalRequiredDays > 0 ? (selectedDatesLength / totalRequiredDays) * 100 : 0}%` }}
          ></div>
        </div>
        {selectedDatesLength === totalRequiredDays && totalRequiredDays > 0 && (
          <p className="text-green-700 font-medium">✓ Όλες οι ημερομηνίες επιλέχθηκαν!</p>
        )}
        {selectedDatesLength > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearAll}
            className="rounded-none mt-2"
          >
            Καθαρισμός Όλων
          </Button>
        )}
      </div>
    </div>
  );
};
