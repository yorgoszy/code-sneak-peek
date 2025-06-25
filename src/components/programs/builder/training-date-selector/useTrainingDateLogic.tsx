
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
      // Check if we can add the date based on week structure
      if (canAddDateToWeek(dateString)) {
        const newDates = [...selectedDates, dateString].sort();
        console.log('🗓️ [TrainingDateSelector] Adding date, new array:', newDates);
        onDatesChange(newDates);
      } else {
        console.log('🗓️ [TrainingDateSelector] Cannot add date - week limit reached');
      }
    }
  };

  const canAddDateToWeek = (newDateString: string) => {
    // If we haven't reached the total limit, check week-specific limits
    if (selectedDates.length >= totalRequiredDays) {
      return false;
    }

    // Calculate which week this date would belong to
    const sortedDates = [...selectedDates, newDateString].sort();
    const newDateIndex = sortedDates.indexOf(newDateString);
    
    // Determine which week this date belongs to based on its position
    let currentWeekIndex = 0;
    let daysCountedSoFar = 0;
    
    for (let i = 0; i < weekStructure.length; i++) {
      if (newDateIndex < daysCountedSoFar + weekStructure[i].daysInWeek) {
        currentWeekIndex = i;
        break;
      }
      daysCountedSoFar += weekStructure[i].daysInWeek;
    }

    // Count how many dates are already selected for this week
    const weekStartIndex = daysCountedSoFar;
    const weekEndIndex = weekStartIndex + weekStructure[currentWeekIndex].daysInWeek;
    
    // Count existing selections in this week range (excluding the new date)
    const existingDatesInWeek = selectedDates.filter((_, index) => {
      const sortedIndex = [...selectedDates].sort().indexOf(selectedDates[index]);
      return sortedIndex >= weekStartIndex && sortedIndex < weekEndIndex;
    }).length;

    console.log('🗓️ [TrainingDateSelector] Week analysis:', {
      newDateIndex,
      currentWeekIndex,
      weekStartIndex,
      weekEndIndex,
      existingDatesInWeek,
      allowedDaysInWeek: weekStructure[currentWeekIndex].daysInWeek
    });

    return existingDatesInWeek < weekStructure[currentWeekIndex].daysInWeek;
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

    // Check if we can add this date based on week structure
    const cleanDate = createDateFromCalendar(date);
    const dateString = formatDateToLocalString(cleanDate);
    
    return !canAddDateToWeek(dateString);
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
