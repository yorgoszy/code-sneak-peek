
import React from 'react';
import { Button } from "@/components/ui/button";

interface CalendarToggleProps {
  calendarOpen: boolean;
  onToggle: () => void;
}

export const CalendarToggle: React.FC<CalendarToggleProps> = ({
  calendarOpen,
  onToggle
}) => {
  return (
    <Button
      variant="outline"
      onClick={onToggle}
      className="w-full rounded-none"
    >
      {calendarOpen ? 'Απόκρυψη Ημερολογίου' : 'Εμφάνιση Ημερολογίου'}
    </Button>
  );
};
