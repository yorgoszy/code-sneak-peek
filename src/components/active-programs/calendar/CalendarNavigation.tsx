
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
    <div className="flex items-center justify-between mb-1">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
        className="rounded-none h-7 w-7 sm:h-8 sm:w-auto sm:px-2 p-0"
      >
        <ChevronLeft className="h-3 w-3" />
      </Button>
      <h3 className="text-xs sm:text-sm font-semibold px-2">
        {format(currentMonth, 'MMMM yyyy', { locale: el })}
      </h3>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
        className="rounded-none h-7 w-7 sm:h-8 sm:w-auto sm:px-2 p-0"
      >
        <ChevronRight className="h-3 w-3" />
      </Button>
    </div>
  );
};
