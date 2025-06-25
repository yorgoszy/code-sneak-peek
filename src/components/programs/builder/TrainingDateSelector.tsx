
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import { CalendarIcon, X } from "lucide-react";
import { formatDateToLocalString, parseDateFromString, createDateFromCalendar } from '@/utils/dateUtils';

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

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) {
      console.log('🗓️ [TrainingDateSelector] No date selected');
      return;
    }
    
    console.log('🗓️ [TrainingDateSelector] Date selected:', date);
    
    const cleanDate = createDateFromCalendar(date);
    const dateString = formatDateToLocalString(cleanDate);
    
    console.log('🗓️ [TrainingDateSelector] Formatted date string:', dateString);
    
    if (selectedDates.includes(dateString)) {
      // Remove date if already selected (αποεπιλογή)
      const newDates = selectedDates.filter(d => d !== dateString);
      console.log('🗓️ [TrainingDateSelector] Removing date, new array:', newDates);
      onDatesChange(newDates);
    } else {
      // Add date if not selected
      const newDates = [...selectedDates, dateString].sort();
      console.log('🗓️ [TrainingDateSelector] Adding date, new array:', newDates);
      onDatesChange(newDates);
    }
  };

  const removeDate = (dateToRemove: string) => {
    console.log('🗓️ [TrainingDateSelector] Removing date:', dateToRemove);
    const newDates = selectedDates.filter(d => d !== dateToRemove);
    console.log('🗓️ [TrainingDateSelector] After removal:', newDates);
    onDatesChange(newDates);
  };

  const clearAllDates = () => {
    console.log('🗓️ [TrainingDateSelector] Clearing all dates');
    onDatesChange([]);
  };

  const isDateSelected = (date: Date) => {
    const cleanDate = createDateFromCalendar(date);
    const dateString = formatDateToLocalString(cleanDate);
    const isSelected = selectedDates.includes(dateString);
    
    console.log('🗓️ [TrainingDateSelector] Checking if date is selected:', {
      dateString: dateString,
      isSelected: isSelected
    });
    
    return isSelected;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  console.log('🗓️ [TrainingDateSelector] Current selectedDates:', selectedDates);

  return (
    <Card className="rounded-none">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <CalendarIcon className="w-5 h-5" />
          Επιλογή Ημερομηνιών Προπόνησης
        </CardTitle>
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
              weekStartsOn={1}
              modifiers={{
                selected: isDateSelected,
                today: isToday
              }}
              modifiersClassNames={{
                selected: "bg-[#00ffba] text-black hover:bg-[#00ffba]/90",
                today: "bg-[#00cc94] text-black font-bold border-2 border-[#00ffba]"
              }}
            />
          </div>

          {/* Selected Dates - Hidden as requested by user */}
          <div style={{ display: 'none' }}>
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
                      {format(parseDateFromString(dateString), 'dd/MM/yyyy - EEEE', { locale: el })}
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
        
        {/* Summary info */}
        <div className="text-sm text-gray-600 bg-blue-50 p-3 border border-blue-200 rounded-none">
          <p>Επιλεγμένες ημερομηνίες: {selectedDates.length}</p>
          <p className="text-xs mt-1">💡 Κάντε κλικ σε μια ημερομηνία για επιλογή ή αποεπιλογή</p>
        </div>
      </CardContent>
    </Card>
  );
};
