
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
          {/* Calendar με custom day content */}
          <div className="flex justify-center">
            <div className="relative">
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
                components={{
                  DayContent: ({ date }) => {
                    const dateString = format(date, 'yyyy-MM-dd');
                    const isSelected = selectedDates.includes(dateString);
                    
                    return (
                      <div className="relative w-full h-full flex items-center justify-center">
                        <span>{date.getDate()}</span>
                        {isSelected && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeDate(dateString);
                            }}
                            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 text-xs"
                          >
                            <X className="w-2 h-2" />
                          </button>
                        )}
                      </div>
                    );
                  }
                }}
              />
            </div>
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
