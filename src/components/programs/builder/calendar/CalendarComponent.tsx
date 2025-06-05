
import React from 'react';
import { Calendar } from "@/components/ui/calendar";

interface CalendarComponentProps {
  selectedDates: Date[];
  totalDays: number;
  weekStructure: any[];
  onDateSelect: (date: Date | undefined) => void;
  onDatesChange: (dates: Date[]) => void;
  validateWeekSelection: (date: Date) => boolean;
}

export const CalendarComponent: React.FC<CalendarComponentProps> = ({
  selectedDates,
  totalDays,
  weekStructure,
  onDateSelect,
  onDatesChange,
  validateWeekSelection
}) => {
  return (
    <div className="border rounded-none p-4">
      <Calendar
        mode="multiple"
        selected={selectedDates}
        onSelect={(dates) => {
          if (dates) {
            const datesArray = Array.isArray(dates) ? dates : [dates];
            if (datesArray.length <= totalDays) {
              onDatesChange(datesArray);
            }
          }
        }}
        className="rounded-none"
        weekStartsOn={0}
        disabled={(date) => {
          // Απενεργοποίηση παλαιών ημερομηνιών
          if (date < new Date()) return true;
          
          // Αν δεν έχουμε δομή εβδομάδων, χρησιμοποιούμε την παλιά λογική
          if (weekStructure.length === 0) {
            const isSelected = selectedDates.some(d => d.toDateString() === date.toDateString());
            return !isSelected && selectedDates.length >= totalDays;
          }
          
          // Νέα λογική βάσει δομής εβδομάδων
          const isSelected = selectedDates.some(d => d.toDateString() === date.toDateString());
          if (isSelected) return false;
          
          return !validateWeekSelection(date);
        }}
      />
    </div>
  );
};
