
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
    <div className="flex items-center justify-between mb-2 sm:mb-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
        className="rounded-none h-8 w-8 sm:h-10 sm:w-auto sm:px-3"
      >
        <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
      </Button>
      <h3 className="text-sm sm:text-lg font-semibold px-2">
        {format(currentMonth, 'MMMM yyyy', { locale: el })}
      </h3>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
        className="rounded-none h-8 w-8 sm:h-10 sm:w-auto sm:px-3"
      >
        <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
      </Button>
    </div>
  );
};
