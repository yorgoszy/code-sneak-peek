
import React from 'react';
import { Calendar } from "@/components/ui/calendar";

interface CalendarDisplayProps {
  selectedDates: Date[];
  totalDaysRequired: number;
  onDateSelect: (date: Date | undefined) => void;
  isDateSelected: (date: Date) => boolean;
  isDateDisabled: (date: Date) => boolean;
}

export const CalendarDisplay: React.FC<CalendarDisplayProps> = ({
  selectedDates,
  totalDaysRequired,
  onDateSelect,
  isDateSelected,
  isDateDisabled
}) => {
  return (
    <div className="border border-gray-200 rounded-none p-4">
      <Calendar
        mode="single"
        selected={undefined}
        onSelect={onDateSelect}
        className="rounded-none w-full"
        weekStartsOn={1}
        disabled={isDateDisabled}
        modifiers={{
          selected: isDateSelected
        }}
        modifiersClassNames={{
          selected: "bg-[#00ffba] text-black hover:bg-[#00ffba]/90"
        }}
      />
      
      <div className="mt-3 text-xs text-gray-600 space-y-1">
        <p>💡 Κάντε κλικ σε μια ημερομηνία για να την επιλέξετε/αφαιρέσετε</p>
        <p>📅 Μπορείτε να επιλέξετε μέχρι {totalDaysRequired} ημερομηνίες</p>
        <p>🚫 Παλαιές ημερομηνίες είναι απενεργοποιημένες</p>
      </div>
    </div>
  );
};
