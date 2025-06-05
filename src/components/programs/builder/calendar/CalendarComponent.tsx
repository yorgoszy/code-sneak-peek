
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
  const handleSelect = (dates: Date[] | Date | undefined) => {
    if (dates) {
      const datesArray = Array.isArray(dates) ? dates : [dates];
      if (datesArray.length <= totalDays) {
        onDatesChange(datesArray);
      }
    }
  };

  return (
    <div className="border rounded-none p-4">
      <Calendar
        mode="multiple"
        selected={selectedDates}
        onSelect={handleSelect}
        className="rounded-none"
        weekStartsOn={0}
        timeZone="Europe/Athens"
        disabled={(date) => {
          // Απενεργοποίηση παλαιών ημερομηνιών
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (date < today) return true;
          
          // Αν δεν έχουμε δομή εβδομάδων, χρησιμοποιούμε την παλιά λογική
          if (weekStructure.length === 0) {
            const isSelected = selectedDates.some(d => {
              const selectedDate = new Date(d);
              selectedDate.setHours(0, 0, 0, 0);
              const checkDate = new Date(date);
              checkDate.setHours(0, 0, 0, 0);
              return selectedDate.getTime() === checkDate.getTime();
            });
            return !isSelected && selectedDates.length >= totalDays;
          }
          
          // Νέα λογική βάσει δομής εβδομάδων
          const isSelected = selectedDates.some(d => {
            const selectedDate = new Date(d);
            selectedDate.setHours(0, 0, 0, 0);
            const checkDate = new Date(date);
            checkDate.setHours(0, 0, 0, 0);
            return selectedDate.getTime() === checkDate.getTime();
          });
          if (isSelected) return false;
          
          return !validateWeekSelection(date);
        }}
      />
    </div>
  );
};
