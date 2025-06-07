
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
        className="rounded-none w-full [&_.day]:hover:bg-transparent [&_.day]:hover:text-current"
        weekStartsOn={1}
        disabled={isDateDisabled}
        modifiers={{
          selected: isDateSelected
        }}
        modifiersClassNames={{
          selected: "bg-[#00ffba] text-black hover:bg-[#00ffba] hover:text-black"
        }}
      />
    </div>
  );
};
