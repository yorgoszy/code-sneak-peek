
import React from 'react';
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import { X, Trash2 } from "lucide-react";

interface SelectedDatesSectionProps {
  selectedDates: Date[];
  onRemoveDate: (date: Date) => void;
  onClearAllDates: () => void;
}

export const SelectedDatesSection: React.FC<SelectedDatesSectionProps> = ({
  selectedDates,
  onRemoveDate,
  onClearAllDates
}) => {
  if (selectedDates.length === 0) return null;

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-medium">Επιλεγμένες Ημερομηνίες</h4>
        <Button
          variant="outline"
          size="sm"
          onClick={onClearAllDates}
          className="rounded-none"
        >
          <Trash2 className="w-4 h-4 mr-1" />
          Καθαρισμός
        </Button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
        {selectedDates.map((date, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-2 bg-[#00ffba] text-black border border-gray-200 rounded-none text-sm"
          >
            <span>{format(date, 'dd/MM/yyyy', { locale: el })}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemoveDate(date)}
              className="h-5 w-5 p-0 hover:bg-black/10 rounded-none"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
