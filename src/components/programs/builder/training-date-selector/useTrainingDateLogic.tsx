
import { useState } from 'react';
import { UseTrainingDateLogicProps } from './types';

export const useTrainingDateLogic = ({
  selectedDates,
  onDatesChange,
  totalRequiredDays,
  weekStructure = []
}: UseTrainingDateLogicProps) => {
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());

  const createCleanDate = (date: Date): Date => {
    const cleanDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
    console.log('🗓️ [useTrainingDateLogic] createCleanDate:', {
      input: date,
      output: cleanDate,
      inputDebug: `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`,
      outputDebug: `${cleanDate.getDate()}/${cleanDate.getMonth() + 1}/${cleanDate.getFullYear()}`
    });
    return cleanDate;
  };

  const dateToString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const result = `${year}-${month}-${day}`;
    
    console.log('🗓️ [useTrainingDateLogic] dateToString:', {
      input: date,
      result: result,
      components: { year, month: date.getMonth() + 1, day: date.getDate() },
      verification: `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} → ${result}`
    });
    
    return result;
  };

  // ΒΕΛΤΙΩΜΕΝΗ ΛΟΓΙΚΗ: Υπολογισμός εβδομάδας βάσει χρονολογικής θέσης
  const getWeekForDateIndex = (dateIndex: number) => {
    if (weekStructure.length === 0) return 0;
    
    let totalDaysProcessed = 0;
    for (let weekIndex = 0; weekIndex < weekStructure.length; weekIndex++) {
      const daysInThisWeek = weekStructure[weekIndex].program_days?.length || 0;
      if (dateIndex < totalDaysProcessed + daysInThisWeek) {
        return weekIndex;
      }
      totalDaysProcessed += daysInThisWeek;
    }
    
    return Math.max(0, weekStructure.length - 1);
  };

  // ΒΕΛΤΙΩΜΕΝΗ ΛΟΓΙΚΗ: Έλεγχος αν μπορούμε να επιλέξουμε ημερομηνία
  const canSelectDate = (date: Date) => {
    if (weekStructure.length === 0) {
      return selectedDates.length < totalRequiredDays;
    }

    const dateString = dateToString(createCleanDate(date));
    
    // Αν η ημερομηνία είναι ήδη επιλεγμένη, επιτρέπουμε την αποεπιλογή
    if (selectedDates.includes(dateString)) {
      return true;
    }

    // Βρίσκουμε σε ποια χρονολογική θέση θα μπει η νέα ημερομηνία
    const sortedDates = [...selectedDates, dateString].sort();
    const newDateIndex = sortedDates.indexOf(dateString);
    
    console.log('🗓️ [useTrainingDateLogic] canSelectDate - checking:', {
      dateString,
      newDateIndex,
      sortedDates,
      selectedDatesLength: selectedDates.length,
      totalRequiredDays
    });

    // Αν έχουμε φτάσει το όριο συνολικών ημερών
    if (selectedDates.length >= totalRequiredDays) {
      console.log('🗓️ [useTrainingDateLogic] canSelectDate - reached total limit');
      return false;
    }

    // Βρίσκουμε σε ποια εβδομάδα ανήκει αυτή η θέση
    const weekIndex = getWeekForDateIndex(newDateIndex);
    const weekData = weekStructure[weekIndex];
    
    if (!weekData) {
      console.log('🗓️ [useTrainingDateLogic] canSelectDate - no week data found');
      return false;
    }

    const allowedDaysInWeek = weekData.program_days?.length || 0;
    
    // Υπολογίζουμε πόσες ημέρες έχουν ήδη επιλεγεί για αυτή την εβδομάδα
    let daysBeforeThisWeek = 0;
    for (let i = 0; i < weekIndex; i++) {
      daysBeforeThisWeek += weekStructure[i].program_days?.length || 0;
    }
    
    const daysAfterThisWeek = daysBeforeThisWeek + allowedDaysInWeek;
    const selectedDatesInThisWeek = selectedDates.filter((_, index) => {
      const sortedIndex = [...selectedDates].sort().indexOf(selectedDates[index]);
      return sortedIndex >= daysBeforeThisWeek && sortedIndex < daysAfterThisWeek;
    }).length;
    
    console.log('🗓️ [useTrainingDateLogic] canSelectDate - week analysis:', {
      weekIndex,
      allowedDaysInWeek,
      daysBeforeThisWeek,
      daysAfterThisWeek,
      selectedDatesInThisWeek,
      canSelect: selectedDatesInThisWeek < allowedDaysInWeek
    });
    
    return selectedDatesInThisWeek < allowedDaysInWeek;
  };

  const getCurrentWeekInfo = () => {
    if (weekStructure.length === 0) {
      return { currentWeekIndex: 0, allowedDaysInCurrentWeek: totalRequiredDays, completedWeeks: 0 };
    }

    const currentDateIndex = selectedDates.length;
    const currentWeekIndex = getWeekForDateIndex(currentDateIndex);
    
    let completedWeeks = 0;
    let totalDaysProcessed = 0;
    
    for (let i = 0; i < currentWeekIndex; i++) {
      const weekDays = weekStructure[i].program_days?.length || 0;
      if (totalDaysProcessed + weekDays <= selectedDates.length) {
        completedWeeks++;
      }
      totalDaysProcessed += weekDays;
    }

    const allowedDaysInCurrentWeek = currentWeekIndex < weekStructure.length 
      ? weekStructure[currentWeekIndex].program_days?.length || 0 
      : 0;

    console.log('🗓️ [useTrainingDateLogic] getCurrentWeekInfo:', {
      selectedDatesLength: selectedDates.length,
      currentWeekIndex,
      allowedDaysInCurrentWeek,
      completedWeeks,
      weekStructure: weekStructure.map(w => ({ 
        weekNumber: w.week_number, 
        days: w.program_days?.length || 0 
      }))
    });

    return { currentWeekIndex, allowedDaysInCurrentWeek, completedWeeks };
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) {
      console.log('🗓️ [useTrainingDateLogic] No date selected');
      return;
    }
    
    console.log('🗓️ [useTrainingDateLogic] Raw date selected:', {
      date: date,
      toString: date.toString(),
      getFullYear: date.getFullYear(),
      getMonth: date.getMonth(),
      getDate: date.getDate(),
      getTimezoneOffset: date.getTimezoneOffset()
    });
    
    const cleanDate = createCleanDate(date);
    const dateString = dateToString(cleanDate);
    
    console.log('🗓️ [useTrainingDateLogic] Processed date:', {
      original: date,
      clean: cleanDate,
      string: dateString,
      currentSelected: selectedDates
    });
    
    if (selectedDates.includes(dateString)) {
      // Remove date if already selected
      const newDates = selectedDates.filter(d => d !== dateString);
      console.log('🗓️ [useTrainingDateLogic] Removing date:', { dateString, newDates });
      onDatesChange(newDates);
    } else {
      // Check if we can add the date
      if (canSelectDate(date)) {
        const newDates = [...selectedDates, dateString].sort();
        console.log('🗓️ [useTrainingDateLogic] Adding date:', { dateString, newDates });
        onDatesChange(newDates);
      } else {
        console.log('🗓️ [useTrainingDateLogic] Cannot add date - week is full or exceeds limits');
      }
    }
  };

  const removeDate = (dateToRemove: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    console.log('🗓️ [useTrainingDateLogic] Removing date:', dateToRemove);
    const newDates = selectedDates.filter(d => d !== dateToRemove);
    console.log('🗓️ [useTrainingDateLogic] After removal:', newDates);
    onDatesChange(newDates);
  };

  const clearAllDates = () => {
    console.log('🗓️ [useTrainingDateLogic] Clearing all dates');
    onDatesChange([]);
  };

  const isDateSelected = (date: Date) => {
    const cleanDate = createCleanDate(date);
    const dateString = dateToString(cleanDate);
    const isSelected = selectedDates.includes(dateString);
    
    console.log('🗓️ [useTrainingDateLogic] isDateSelected check:', {
      date: date,
      cleanDate: cleanDate,
      dateString: dateString,
      selectedDates: selectedDates,
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

    // Use the improved canSelectDate function
    return !canSelectDate(date);
  };

  return {
    calendarDate,
    setCalendarDate,
    handleDateSelect,
    removeDate,
    clearAllDates,
    isDateSelected,
    isToday,
    isDateDisabled,
    getCurrentWeekInfo
  };
};
