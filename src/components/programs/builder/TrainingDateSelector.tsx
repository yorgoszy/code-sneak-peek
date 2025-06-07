
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import { CalendarIcon, X } from "lucide-react";
import { formatDateToLocalString, parseDateFromString, createDateFromCalendar } from '@/utils/dateUtils';

interface Week {
  id: string;
  name: string;
  week_number: number;
  days?: any[];
}

interface TrainingDateSelectorProps {
  selectedDates: string[];
  onDatesChange: (dates: string[]) => void;
  programWeeks?: Week[];
}

export const TrainingDateSelector: React.FC<TrainingDateSelectorProps> = ({
  selectedDates,
  onDatesChange,
  programWeeks = []
}) => {
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());

  // Υπολογισμός συνολικού αριθμού ημερών από όλες τις εβδομάδες
  const totalDaysAllowed = programWeeks.reduce((total, week) => {
    return total + (week.days?.length || 0);
  }, 0);

  console.log('🗓️ [TrainingDateSelector] Program weeks:', programWeeks);
  console.log('🗓️ [TrainingDateSelector] Total days allowed:', totalDaysAllowed);

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
      // Remove date if already selected
      const newDates = selectedDates.filter(d => d !== dateString);
      console.log('🗓️ [TrainingDateSelector] Removing date, new array:', newDates);
      onDatesChange(newDates);
    } else {
      // Check if we can add more dates
      if (selectedDates.length >= totalDaysAllowed) {
        console.log('🗓️ [TrainingDateSelector] Maximum dates reached, cannot add more');
        return;
      }
      
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

  const isDateDisabled = (date: Date) => {
    // Απενεργοποίηση παλαιών ημερομηνιών
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return true;
    
    // Αν η ημερομηνία είναι ήδη επιλεγμένη, δεν την απενεργοποιούμε
    if (isDateSelected(date)) return false;
    
    // Αν έχουμε φτάσει το όριο, απενεργοποιούμε τις υπόλοιπες
    return selectedDates.length >= totalDaysAllowed;
  };

  console.log('🗓️ [TrainingDateSelector] Current selectedDates:', selectedDates);

  return (
    <Card className="rounded-none">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <CalendarIcon className="w-5 h-5" />
          Επιλογή Ημερομηνιών Προπόνησης
          {totalDaysAllowed > 0 && (
            <span className="text-sm font-normal text-gray-600">
              ({selectedDates.length} / {totalDaysAllowed} ημέρες)
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {totalDaysAllowed === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Δημιουργήστε πρώτα εβδομάδες και ημέρες προπόνησης για να επιλέξετε ημερομηνίες
          </div>
        ) : (
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
                disabled={isDateDisabled}
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
                  Επιλεγμένες Ημερομηνίες ({selectedDates.length}/{totalDaysAllowed})
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
        )}
      </CardContent>
    </Card>
  );
};
