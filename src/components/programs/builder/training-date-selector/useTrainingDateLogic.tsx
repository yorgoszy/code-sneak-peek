
import { useState } from 'react';
import { formatDateToLocalString, createDateFromCalendar } from '@/utils/dateUtils';

interface WeekStructure {
  weekNumber: number;
  daysInWeek: number;
}

interface UseTrainingDateLogicProps {
  selectedDates: string[];
  onDatesChange: (dates: string[]) => void;
  totalRequiredDays: number;
  weekStructure: WeekStructure[];
}

export const useTrainingDateLogic = ({
  selectedDates,
  onDatesChange,
  totalRequiredDays,
  weekStructure
}: UseTrainingDateLogicProps) => {
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());

  // Helper function to determine which program week a date belongs to based on chronological order
  const getWeekForDateIndex = (dateIndex: number): WeekStructure | null => {
    let currentIndex = 0;
    for (const week of weekStructure) {
      if (dateIndex < currentIndex + week.daysInWeek) {
        return week;
      }
      currentIndex += week.daysInWeek;
    }
    return null;
  };

  // Helper function to count selected dates in a specific program week
  const getSelectedDatesInWeek = (weekNumber: number): number => {
    const sortedDates = [...selectedDates].sort();
    let count = 0;
    let currentIndex = 0;
    
    for (const week of weekStructure) {
      if (week.weekNumber === weekNumber) {
        // Count how many dates are selected in this week's range
        for (let i = 0; i < week.daysInWeek; i++) {
          if (currentIndex + i < sortedDates.length) {
            count++;
          }
        }
        break;
      }
      currentIndex += week.daysInWeek;
    }
    
    return count;
  };

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
      // Check if we can add the date
      if (canAddDate(dateString)) {
        const newDates = [...selectedDates, dateString].sort();
        console.log('🗓️ [TrainingDateSelector] Adding date, new array:', newDates);
        onDatesChange(newDates);
      } else {
        console.log('🗓️ [TrainingDateSelector] Cannot add date - limit reached');
      }
    }
  };

  const canAddDate = (newDateString: string): boolean => {
    // Check total limit first
    if (selectedDates.length >= totalRequiredDays) {
      console.log('🗓️ [TrainingDateSelector] Total limit reached');
      return false;
    }

    // If no week structure, allow selection up to total limit
    if (weekStructure.length === 0) {
      return true;
    }

    // Create a temporary sorted array with the new date
    const tempDates = [...selectedDates, newDateString].sort();
    const newDateIndex = tempDates.indexOf(newDateString);
    
    // Determine which program week this date would belong to
    const targetWeek = getWeekForDateIndex(newDateIndex);
    
    if (!targetWeek) {
      console.log('🗓️ [TrainingDateSelector] No target week found for index:', newDateIndex);
      return false;
    }

    // Count how many dates are already selected for this program week
    const currentCount = getSelectedDatesInWeek(targetWeek.weekNumber);
    
    console.log('🗓️ [TrainingDateSelector] Week analysis:', {
      newDateIndex,
      targetWeek: targetWeek.weekNumber,
      currentCount,
      allowedDays: targetWeek.daysInWeek,
      canAdd: currentCount < targetWeek.daysInWeek
    });

    return currentCount < targetWeek.daysInWeek;
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

    // Check if we can add this date based on week structure
    const cleanDate = createDateFromCalendar(date);
    const dateString = formatDateToLocalString(cleanDate);
    
    return !canAddDate(dateString);
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
