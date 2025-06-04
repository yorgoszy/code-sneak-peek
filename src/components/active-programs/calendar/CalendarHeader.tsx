
import React from 'react';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

interface CalendarHeaderProps {
  currentDate: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  isCompact?: boolean;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentDate,
  onPreviousMonth,
  onNextMonth,
  isCompact = false
}) => {
  if (isCompact) {
    return (
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={onPreviousMonth}
          className="rounded-none h-6 w-6 p-0"
        >
          <ChevronLeft className="h-3 w-3" />
        </Button>
        <h2 className="text-xs font-medium">
          {format(currentDate, 'MMM yyyy')}
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onNextMonth}
          className="rounded-none h-6 w-6 p-0"
        >
          <ChevronRight className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-row items-center justify-between space-y-0 pb-4">
      <h2 className="text-xl font-bold">
        {format(currentDate, 'MMMM yyyy')}
      </h2>
      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onPreviousMonth}
          className="rounded-none"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onNextMonth}
          className="rounded-none"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
