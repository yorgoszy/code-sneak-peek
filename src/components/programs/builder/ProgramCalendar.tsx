
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, X } from "lucide-react";
import { format } from "date-fns";

interface ProgramCalendarProps {
  selectedDates: Date[];
  onDatesChange: (dates: Date[]) => void;
  totalDays: number;
}

export const ProgramCalendar: React.FC<ProgramCalendarProps> = ({
  selectedDates,
  onDatesChange,
  totalDays
}) => {
  const [calendarOpen, setCalendarOpen] = useState(false);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    const dateExists = selectedDates.some(d => 
      d.toDateString() === date.toDateString()
    );
    
    if (dateExists) {
      // Αφαίρεση ημερομηνίας
      onDatesChange(selectedDates.filter(d => 
        d.toDateString() !== date.toDateString()
      ));
    } else {
      // Προσθήκη ημερομηνίας
      onDatesChange([...selectedDates, date].sort((a, b) => a.getTime() - b.getTime()));
    }
  };

  const removeDate = (dateToRemove: Date) => {
    onDatesChange(selectedDates.filter(d => 
      d.toDateString() !== dateToRemove.toDateString()
    ));
  };

  const clearAllDates = () => {
    onDatesChange([]);
  };

  return (
    <Card className="rounded-none">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5" />
            Ημερολόγιο Προπόνησης
          </CardTitle>
          <div className="text-sm text-gray-600">
            Επιλεγμένες: {selectedDates.length} / Απαιτούμενες: {totalDays}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selected Dates Display */}
        {selectedDates.length > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Επιλεγμένες Ημερομηνίες:</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllDates}
                className="text-red-600 hover:text-red-800 rounded-none"
              >
                Καθαρισμός όλων
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedDates.map((date, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="flex items-center gap-1 px-2 py-1"
                >
                  {format(date, 'dd/MM/yyyy')}
                  <button
                    onClick={() => removeDate(date)}
                    className="text-gray-500 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Calendar Toggle */}
        <Button
          variant="outline"
          onClick={() => setCalendarOpen(!calendarOpen)}
          className="w-full rounded-none"
        >
          {calendarOpen ? 'Απόκρυψη Ημερολογίου' : 'Εμφάνιση Ημερολογίου'}
        </Button>

        {/* Calendar */}
        {calendarOpen && (
          <div className="border rounded-none p-4">
            <Calendar
              mode="multiple"
              selected={selectedDates}
              onSelect={(dates) => {
                if (dates) {
                  onDatesChange(Array.isArray(dates) ? dates : [dates]);
                }
              }}
              className="rounded-none"
              disabled={(date) => date < new Date()}
            />
          </div>
        )}

        {/* Warning if not enough dates */}
        {selectedDates.length < totalDays && (
          <div className="text-orange-600 text-sm p-2 bg-orange-50 border border-orange-200 rounded-none">
            Προειδοποίηση: Χρειάζεστε {totalDays - selectedDates.length} ακόμη ημερομηνίες για να καλύψετε όλες τις ημέρες προπόνησης.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
