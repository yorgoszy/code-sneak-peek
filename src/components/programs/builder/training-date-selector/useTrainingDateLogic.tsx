
import { useState } from 'react';
import { UseTrainingDateLogicProps } from './types';

export const useTrainingDateLogic = ({
  selectedDates,
  onDatesChange,
  totalRequiredDays,
  weekStructure = []
}: UseTrainingDateLogicProps) => {
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());

  // ΔΙΟΡΘΩΣΗ: Βελτιωμένη συνάρτηση για δημιουργία καθαρών ημερομηνιών
  const createCleanDate = (date: Date): Date => {
    // Δημιουργούμε νέα ημερομηνία με τα ίδια στοιχεία αλλά στο μεσημέρι
    const cleanDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
    console.log('🗓️ [useTrainingDateLogic] createCleanDate:', {
      input: date,
      output: cleanDate,
      inputDebug: `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`,
      outputDebug: `${cleanDate.getDate()}/${cleanDate.getMonth() + 1}/${cleanDate.getFullYear()}`
    });
    return cleanDate;
  };

  // ΔΙΟΡΘΩΣΗ: Βελτιωμένη συνάρτηση για μετατροπή σε string
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

  // ΝΕΑ ΛΟΓΙΚΗ: Υπολογισμός της τρέχουσας εβδομάδας και των επιτρεπόμενων ημερών
  const getCurrentWeekInfo = () => {
    if (weekStructure.length === 0) {
      return { currentWeekIndex: 0, allowedDaysInCurrentWeek: totalRequiredDays, completedWeeks: 0 };
    }

    let totalSelectedDays = 0;
    let currentWeekIndex = 0;
    let completedWeeks = 0;

    for (let i = 0; i < weekStructure.length; i++) {
      const weekDays = weekStructure[i].program_days?.length || 0;
      
      if (totalSelectedDays + weekDays <= selectedDates.length) {
        // Αυτή η εβδομάδα έχει ολοκληρωθεί
        totalSelectedDays += weekDays;
        completedWeeks++;
        currentWeekIndex = i + 1;
      } else {
        // Αυτή είναι η τρέχουσα εβδομάδα που επεξεργαζόμαστε
        currentWeekIndex = i;
        break;
      }
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

  // ΝΕΑ ΛΟΓΙΚΗ: Έλεγχος αν μπορούμε να προσθέσουμε άλλη ημερομηνία
  const canAddMoreDates = () => {
    if (weekStructure.length === 0) {
      return selectedDates.length < totalRequiredDays;
    }

    const { currentWeekIndex, allowedDaysInCurrentWeek, completedWeeks } = getCurrentWeekInfo();
    
    // Υπολογίζουμε πόσες ημερομηνίες έχουμε επιλέξει για την τρέχουσα εβδομάδα
    let daysInPreviousWeeks = 0;
    for (let i = 0; i < currentWeekIndex; i++) {
      daysInPreviousWeeks += weekStructure[i].program_days?.length || 0;
    }
    
    const daysSelectedInCurrentWeek = selectedDates.length - daysInPreviousWeeks;
    
    console.log('🗓️ [useTrainingDateLogic] canAddMoreDates check:', {
      currentWeekIndex,
      allowedDaysInCurrentWeek,
      daysSelectedInCurrentWeek,
      daysInPreviousWeeks,
      totalSelected: selectedDates.length,
      canAdd: daysSelectedInCurrentWeek < allowedDaysInCurrentWeek
    });

    return daysSelectedInCurrentWeek < allowedDaysInCurrentWeek;
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
    
    // ΔΙΟΡΘΩΣΗ: Χρησιμοποιούμε τη βελτιωμένη συνάρτηση για καθαρές ημερομηνίες
    const cleanDate = createCleanDate(date);
    const dateString = dateToString(cleanDate);
    
    console.log('🗓️ [useTrainingDateLogic] Processed date:', {
      original: date,
      clean: cleanDate,
      string: dateString,
      currentSelected: selectedDates
    });
    
    if (selectedDates.includes(dateString)) {
      // Remove date if already selected (αποεπιλογή)
      const newDates = selectedDates.filter(d => d !== dateString);
      console.log('🗓️ [useTrainingDateLogic] Removing date:', { dateString, newDates });
      onDatesChange(newDates);
    } else {
      // ΝΕΑ ΛΟΓΙΚΗ: Έλεγχος αν μπορούμε να προσθέσουμε την ημερομηνία
      if (canAddMoreDates()) {
        // Add date if not selected and within limits
        const newDates = [...selectedDates, dateString].sort();
        console.log('🗓️ [useTrainingDateLogic] Adding date:', { dateString, newDates });
        onDatesChange(newDates);
      } else {
        const { currentWeekIndex, allowedDaysInCurrentWeek } = getCurrentWeekInfo();
        console.log('🗓️ [useTrainingDateLogic] Cannot add more dates for current week:', {
          currentWeekIndex: currentWeekIndex + 1,
          allowedDaysInCurrentWeek,
          selected: selectedDates.length
        });
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
    const result = date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
    
    return result;
  };

  const isDateDisabled = (date: Date) => {
    // Disable past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return true;

    // If date is already selected, allow it (for deselection)
    if (isDateSelected(date)) return false;

    // ΝΕΑ ΛΟΓΙΚΗ: Αν δεν μπορούμε να προσθέσουμε άλλες ημερομηνίες, disable όλες τις μη επιλεγμένες
    return !canAddMoreDates();
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
