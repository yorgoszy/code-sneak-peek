
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { format } from "date-fns";

interface SelectedDatesDisplayProps {
  selectedDates: Date[];
  onRemoveDate: (date: Date) => void;
  onClearAll: () => void;
}

export const SelectedDatesDisplay: React.FC<SelectedDatesDisplayProps> = ({
  selectedDates,
  onRemoveDate,
  onClearAll
}) => {
  if (selectedDates.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">Επιλεγμένες Ημερομηνίες:</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="text-red-600 hover:text-red-800 rounded-none"
        >
          Καθαρισμός όλων
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {selectedDates.map((date, index) => (
          <Badge
            key={index}
            variant="secondary"
            className="flex items-center gap-1 px-2 py-1"
          >
            {format(date, 'dd/MM/yyyy')}
            <button
              onClick={() => onRemoveDate(date)}
              className="text-gray-500 hover:text-red-600"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
};
