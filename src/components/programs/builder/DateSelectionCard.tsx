
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";
import { el } from "date-fns/locale";

interface DateSelectionCardProps {
  selectedDates: string[];
  daysPerWeek: number;
  totalWeeks: number;
  totalRequiredSessions: number;
  onDateSelect: (date: Date | undefined) => void;
  onClearAllDates: () => void;
  isDateSelected: (date: Date) => boolean;
  isDateDisabled: (date: Date) => boolean;
}

export const DateSelectionCard: React.FC<DateSelectionCardProps> = ({
  selectedDates,
  daysPerWeek,
  totalWeeks,
  totalRequiredSessions,
  onDateSelect,
  onClearAllDates,
  isDateSelected,
  isDateDisabled
}) => {
  return (
    <Card className="rounded-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5" />
          Επιλογή Ημερομηνιών Προπόνησης
        </CardTitle>
        <p className="text-sm text-gray-600">
          Επιλέξτε {daysPerWeek} ημέρες την εβδομάδα για {totalWeeks} εβδομάδες 
          ({selectedDates.length}/{totalRequiredSessions} προπονήσεις)
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-4">
          {/* Calendar */}
          <Calendar
            mode="single"
            selected={undefined}
            onSelect={onDateSelect}
            className="rounded-none border pointer-events-auto"
            locale={el}
            modifiers={{
              selected: isDateSelected
            }}
            modifiersClassNames={{
              selected: "bg-blue-500 text-white hover:bg-blue-600"
            }}
            disabled={isDateDisabled}
          />

          {/* Clear All Button */}
          {selectedDates.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearAllDates}
              className="rounded-none"
            >
              Αποεπιλογή Όλων ({selectedDates.length})
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
