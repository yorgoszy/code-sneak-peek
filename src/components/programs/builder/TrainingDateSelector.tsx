
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import { CalendarIcon, X } from "lucide-react";

interface TrainingDateSelectorProps {
  selectedDates: string[];
  onDatesChange: (dates: string[]) => void;
  programWeeks?: number;
}

export const TrainingDateSelector: React.FC<TrainingDateSelectorProps> = ({
  selectedDates,
  onDatesChange,
  programWeeks = 0
}) => {
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());

  // Helper function για σωστή μετατροπή ημερομηνιών χωρίς timezone issues
  const formatDateToString = (date: Date): string => {
    // Χρησιμοποιούμε UTC για να αποφύγουμε timezone προβλήματα
    const utcYear = date.getUTCFullYear();
    const utcMonth = String(date.getUTCMonth() + 1).padStart(2, '0');
    const utcDay = String(date.getUTCDate()).padStart(2, '0');
    
    return `${utcYear}-${utcMonth}-${utcDay}`;
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    // Δημιουργούμε ένα νέο Date object στη UTC timezone
    const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dateString = formatDateToString(utcDate);
    
    console.log('📅 Training date selection:', {
      originalDate: date,
      utcDate: utcDate,
      dateString: dateString
    });
    
    if (selectedDates.includes(dateString)) {
      // Remove date if already selected
      onDatesChange(selectedDates.filter(d => d !== dateString));
    } else {
      // Add date if not selected
      onDatesChange([...selectedDates, dateString].sort());
    }
  };

  const removeDate = (dateToRemove: string) => {
    onDatesChange(selectedDates.filter(d => d !== dateToRemove));
  };

  const clearAllDates = () => {
    onDatesChange([]);
  };

  const isDateSelected = (date: Date) => {
    const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dateString = formatDateToString(utcDate);
    return selectedDates.includes(dateString);
  };

  return (
    <Card className="rounded-none">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <CalendarIcon className="w-5 h-5" />
          Επιλογή Συγκεκριμένων Ημερομηνιών Προπόνησης
        </CardTitle>
        {programWeeks > 0 && (
          <p className="text-sm text-gray-600">
            Προτεινόμενες προπονήσεις για {programWeeks} εβδομάδες: {programWeeks * 2}-{programWeeks * 3} ημερομηνίες
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Calendar */}
          <div>
            <Calendar
              mode="single"
              selected={undefined}
              onSelect={handleDateSelect}
              onMonthChange={setCalendarDate}
              className="rounded-none border"
              modifiers={{
                selected: isDateSelected
              }}
              modifiersClassNames={{
                selected: "bg-[#00ffba] text-black hover:bg-[#00ffba]/90"
              }}
            />
          </div>

          {/* Selected Dates */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-medium">
                Επιλεγμένες Ημερομηνίες ({selectedDates.length})
              </h4>
              {selectedDates.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllDates}
                  className="rounded-none"
                >
                  Καθαρισμός Όλων
                </Button>
              )}
            </div>
            
            <div className="max-h-64 overflow-y-auto space-y-2">
              {selectedDates.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  Κάντε κλικ στο ημερολόγιο για να επιλέξετε ημερομηνίες
                </p>
              ) : (
                selectedDates.map(dateString => (
                  <div
                    key={dateString}
                    className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded-none"
                  >
                    <span className="text-sm">
                      {format(parseISO(dateString), 'dd/MM/yyyy - EEEE')}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDate(dateString)}
                      className="h-6 w-6 p-0 hover:bg-red-100 rounded-none"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
