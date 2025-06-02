
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { el } from "date-fns/locale";
import { format, parseISO } from "date-fns";

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
  const removeDate = (dateToRemove: string) => {
    const date = parseISO(dateToRemove);
    onDateSelect(date); // Αυτό θα την αφαιρέσει από τη λίστα
  };

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
        <div className="flex flex-col gap-4">
          {/* Επιλεγμένες Ημερομηνίες */}
          {selectedDates.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Επιλεγμένες Ημερομηνίες:</h4>
              <div className="flex flex-wrap gap-2">
                {selectedDates.map((dateString) => (
                  <div
                    key={dateString}
                    className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 text-xs"
                  >
                    <span>{format(parseISO(dateString), 'dd/MM/yyyy', { locale: el })}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-red-100"
                      onClick={() => removeDate(dateString)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Calendar */}
          <div className="flex justify-center">
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
          </div>

          {/* Clear All Button */}
          {selectedDates.length > 0 && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={onClearAllDates}
                className="rounded-none"
              >
                Αποεπιλογή Όλων ({selectedDates.length})
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
