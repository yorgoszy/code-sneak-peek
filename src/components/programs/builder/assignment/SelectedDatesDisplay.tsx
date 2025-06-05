
import React from 'react';
import { X } from "lucide-react";
import { format, parseISO } from "date-fns";

interface SelectedDatesDisplayProps {
  isVisible: boolean;
  selectedDates: string[];
  completedDates: string[];
  isReassignment: boolean;
  onRemoveDate: (date: string) => void;
}

export const SelectedDatesDisplay: React.FC<SelectedDatesDisplayProps> = ({
  isVisible,
  selectedDates,
  completedDates,
  isReassignment,
  onRemoveDate
}) => {
  if (!isVisible || selectedDates.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Επιλεγμένες Ημερομηνίες</h3>
      <div className="flex flex-wrap gap-2">
        {selectedDates.map(date => {
          const isCompleted = completedDates.includes(date);
          const canRemove = !isCompleted || isReassignment;
          
          return (
            <div
              key={date}
              className={`flex items-center gap-2 px-3 py-1 rounded-none border ${
                isCompleted 
                  ? 'bg-green-100 border-green-300 text-green-800' 
                  : 'bg-blue-100 border-blue-300 text-blue-800'
              }`}
            >
              <span className="text-sm font-medium">
                {format(parseISO(date), 'dd/MM/yyyy')}
              </span>
              {isCompleted && (
                <span className="text-xs">(Ολοκληρωμένη)</span>
              )}
              {canRemove && (
                <button
                  onClick={() => onRemoveDate(date)}
                  className="p-0.5 hover:bg-black/10 rounded-none"
                  title="Αφαίρεση ημερομηνίας"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
