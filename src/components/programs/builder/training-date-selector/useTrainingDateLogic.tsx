
import { useState } from 'react';
import { formatDateToLocalString, createDateFromCalendar } from '@/utils/dateUtils';

interface UseTrainingDateLogicProps {
  selectedDates: string[];
  onDatesChange: (dates: string[]) => void;
  totalRequiredDays: number;
}

export const useTrainingDateLogic = ({
  selectedDates,
  onDatesChange,
  totalRequiredDays
}: UseTrainingDateLogicProps) => {
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

  return {
    calendarDate,
    setCalendarDate,
    handleDateSelect,
    removeDate,
    clearAllDates,
    isDateSelected,
    isToday,
    isDateDisabled
  };
};
