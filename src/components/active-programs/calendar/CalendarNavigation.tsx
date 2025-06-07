
import React from 'react';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addMonths, subMonths } from "date-fns";
import { el } from "date-fns/locale";

interface CalendarNavigationProps {
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
}

export const CalendarNavigation: React.FC<CalendarNavigationProps> = ({
  currentMonth,
  setCurrentMonth
}) => {
  return (
    <div className="flex items-center justify-between mb-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
        className="rounded-none"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <h3 className="text-lg font-semibold">
        {format(currentMonth, 'MMMM yyyy', { locale: el })}
      </h3>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
        className="rounded-none"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};
