
import React from 'react';
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays } from "lucide-react";

interface CalendarHeaderProps {
  selectedDatesCount: number;
  totalDaysRequired: number;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  selectedDatesCount,
  totalDaysRequired
}) => {
  return (
    <CardHeader>
      <CardTitle className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5" />
          Ημερολόγιο Ανάθεσης
        </div>
        <Badge variant="outline" className="rounded-none">
          {selectedDatesCount}/{totalDaysRequired} ημέρες
        </Badge>
      </CardTitle>
    </CardHeader>
  );
};
