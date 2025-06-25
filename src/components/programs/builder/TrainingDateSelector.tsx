
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

  // Calculate days per week from the first week structure if available
  const getDaysPerWeek = () => {
    // This should come from the program structure, but for now we'll use a default
    // You might need to pass this as a prop from the parent component
    return 2; // Default to 2 days per week
  };

  const daysPerWeek = getDaysPerWeek();
  const totalRequiredDays = programWeeks * daysPerWeek;

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
      // Check if we can add more dates
      if (selectedDates.length < totalRequiredDays) {
        // Add date if not selected and within limits
        const newDates = [...selectedDates, dateString].sort();
        console.log('🗓️ [TrainingDateSelector] Adding date, new array:', newDates);
        onDatesChange(newDates);
      } else {
        console.log('🗓️ [TrainingDateSelector] Cannot add more dates - limit reached');
      }
    }
  };

  const removeDate = (dateToRemove: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
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

  const isDateDisabled = (date: Date) => {
    // Disable past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return true;

    // If date is already selected, allow it (for deselection)
    if (isDateSelected(date)) return false;

    // If we've reached the limit, disable all unselected dates
    return selectedDates.length >= totalRequiredDays;
  };

  // Custom day content to add X button for selected dates
  const renderDayContent = (date: Date) => {
    const isSelected = isDateSelected(date);
    const isTodayDate = isToday(date);
    
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <span className={isTodayDate ? "font-bold" : ""}>{date.getDate()}</span>
        {isSelected && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute -top-1 -right-1 h-4 w-4 p-0 bg-red-500 hover:bg-red-600 text-white rounded-full"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const cleanDate = createDateFromCalendar(date);
              const dateString = formatDateToLocalString(cleanDate);
              removeDate(dateString, e);
            }}
          >
            <X className="h-2 w-2" />
          </Button>
        )}
      </div>
    );
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
              disabled={isDateDisabled}
              components={{
                DayContent: ({ date }) => renderDayContent(date)
              }}
              modifiers={{
                selected: isDateSelected,
                today: isToday
              }}
              modifiersClassNames={{
                selected: "bg-[#00ffba] text-black hover:bg-[#00ffba]/90",
                today: "bg-gray-300 text-black border-2 border-gray-500"
              }}
            />
          </div>

          {/* Program Info and Progress */}
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-none p-4">
              <h4 className="font-medium text-blue-800 mb-2">Απαιτήσεις Προγράμματος</h4>
              <div className="space-y-2 text-sm">
                <p><strong>Εβδομάδες:</strong> {programWeeks}</p>
                <p><strong>Ημέρες ανά εβδομάδα:</strong> {daysPerWeek}</p>
                <p><strong>Συνολικές ημέρες:</strong> {totalRequiredDays}</p>
                <p className="text-lg font-bold text-blue-700">
                  {daysPerWeek}days/{programWeeks}weeks
                </p>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-none p-4">
              <h4 className="font-medium text-green-800 mb-2">Πρόοδος Επιλογής</h4>
              <div className="space-y-2 text-sm">
                <p><strong>Επιλεγμένες ημερομηνίες:</strong> {selectedDates.length} / {totalRequiredDays}</p>
                <div className="w-full bg-gray-200 rounded-none h-2">
                  <div 
                    className="bg-[#00ffba] h-2 rounded-none transition-all duration-300" 
                    style={{ width: `${totalRequiredDays > 0 ? (selectedDates.length / totalRequiredDays) * 100 : 0}%` }}
                  ></div>
                </div>
                {selectedDates.length === totalRequiredDays && totalRequiredDays > 0 && (
                  <p className="text-green-700 font-medium">✓ Όλες οι ημερομηνίες επιλέχθηκαν!</p>
                )}
                {selectedDates.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearAllDates}
                    className="rounded-none mt-2"
                  >
                    Καθαρισμός Όλων
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Instructions */}
        <div className="text-sm text-gray-600 bg-blue-50 p-3 border border-blue-200 rounded-none">
          <p className="font-medium">Οδηγίες:</p>
          <ul className="mt-1 space-y-1 text-xs">
            <li>💡 Κάντε κλικ σε μια ημερομηνία για επιλογή</li>
            <li>💡 Κάντε κλικ στο "X" για αποεπιλογή επιλεγμένης ημερομηνίας</li>
            <li>⚠️ Μπορείτε να επιλέξετε μέχρι {totalRequiredDays} ημερομηνίες συνολικά</li>
            <li>📅 Η σημερινή ημερομηνία εμφανίζεται με γκρι χρώμα</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
