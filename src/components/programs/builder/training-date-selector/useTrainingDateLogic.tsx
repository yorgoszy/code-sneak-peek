
import { useState } from 'react';
import { formatDateToLocalString, createDateFromCalendar } from '@/utils/dateUtils';
import type { WeekStructure } from './types';

interface UseTrainingDateLogicProps {
  selectedDates: string[];
  onDatesChange: (dates: string[]) => void;
  totalRequiredDays: number;
  weekStructure?: WeekStructure[];
}

export const useTrainingDateLogic = ({
  selectedDates,
  onDatesChange,
  totalRequiredDays,
  weekStructure = []
}: UseTrainingDateLogicProps) => {
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());

  // Helper function to determine which week a selected date index belongs to
  const getWeekForDateIndex = (dateIndex: number) => {
    if (weekStructure.length === 0) return null;

    let currentIndex = 0;
    for (let i = 0; i < weekStructure.length; i++) {
      const week = weekStructure[i];
      if (dateIndex >= currentIndex && dateIndex < currentIndex + week.daysInWeek) {
        return {
          weekIndex: i,
          weekStructure: week,
          positionInWeek: dateIndex - currentIndex
        };
      }
      currentIndex += week.daysInWeek;
    }
    return null;
  };

  // Check if we can add more dates to a specific week
  const canAddToWeek = (newDateIndex: number) => {
    if (weekStructure.length === 0) {
      return selectedDates.length < totalRequiredDays;
    }

    const weekInfo = getWeekForDateIndex(newDateIndex);
    if (!weekInfo) return false;

    // Count how many dates are already selected for this week
    let selectedInThisWeek = 0;
    const weekStartIndex = weekInfo.weekStructure.totalDaysBeforeWeek;
    const weekEndIndex = weekStartIndex + weekInfo.weekStructure.daysInWeek - 1;

    for (let i = 0; i < selectedDates.length; i++) {
      const currentWeekInfo = getWeekForDateIndex(i);
      if (currentWeekInfo && currentWeekInfo.weekIndex === weekInfo.weekIndex) {
        selectedInThisWeek++;
      }
    }

    console.log('🗓️ [useTrainingDateLogic] Week capacity check:', {
      weekNumber: weekInfo.weekStructure.weekNumber,
      selectedInThisWeek,
      maxForWeek: weekInfo.weekStructure.daysInWeek,
      canAdd: selectedInThisWeek < weekInfo.weekStructure.daysInWeek
    });

    return selectedInThisWeek < weekInfo.weekStructure.daysInWeek;
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
      // Check if we can add more dates based on week structure
      const newDateIndex = selectedDates.length; // This would be the index of the new date
      
      if (canAddToWeek(newDateIndex)) {
        const newDates = [...selectedDates, dateString].sort();
        console.log('🗓️ [TrainingDateSelector] Adding date, new array:', newDates);
        onDatesChange(newDates);
      } else {
        console.log('🗓️ [TrainingDateSelector] Cannot add more dates - week limit reached');
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

    // Check based on week structure
    if (weekStructure.length === 0) {
      return selectedDates.length >= totalRequiredDays;
    }

    // For week structure, check if the current "chronological week" can accept more dates
    const newDateIndex = selectedDates.length;
    return !canAddToWeek(newDateIndex);
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
