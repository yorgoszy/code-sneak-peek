
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

  // ΝΕΑ ΛΟΓΙΚΗ: Υπολογισμός εβδομάδας για συγκεκριμένη ημερομηνία
  const getWeekForDate = (date: Date) => {
    if (weekStructure.length === 0) return 0;
    
    // Ταξινομούμε τις επιλεγμένες ημερομηνίες
    const sortedDates = [...selectedDates].sort();
    
    // Βρίσκουμε τη θέση της ημερομηνίας αν ήταν επιλεγμένη
    const dateString = dateToString(createCleanDate(date));
    let datePosition = sortedDates.indexOf(dateString);
    
    // Αν δεν είναι επιλεγμένη, υπολογίζουμε τη θέση της βάσει χρονολογικής σειράς
    if (datePosition === -1) {
      datePosition = sortedDates.filter(d => d < dateString).length;
    }
    
    // Υπολογίζουμε σε ποια εβδομάδα ανήκει
    let totalDaysBeforeCurrentWeek = 0;
    for (let i = 0; i < weekStructure.length; i++) {
      const weekDays = weekStructure[i].program_days?.length || 0;
      if (datePosition < totalDaysBeforeCurrentWeek + weekDays) {
        return i;
      }
      totalDaysBeforeCurrentWeek += weekDays;
    }
    
    return weekStructure.length - 1; // Τελευταία εβδομάδα αν περάσαμε όλες
  };

  // ΝΕΑ ΛΟΓΙΚΗ: Έλεγχος αν μπορούμε να προσθέσουμε ημερομηνία σε συγκεκριμένη εβδομάδα
  const canSelectDateInWeek = (date: Date) => {
    if (weekStructure.length === 0) {
      return selectedDates.length < totalRequiredDays;
    }

    const dateString = dateToString(createCleanDate(date));
    
    // Αν η ημερομηνία είναι ήδη επιλεγμένη, επιτρέπουμε την αποεπιλογή
    if (selectedDates.includes(dateString)) {
      return true;
    }

    // Υπολογίζουμε σε ποια εβδομάδα θα ανήκει αυτή η ημερομηνία
    const targetWeek = getWeekForDate(date);
    if (targetWeek >= weekStructure.length) return false;

    const targetWeekStructure = weekStructure[targetWeek];
    const allowedDaysInWeek = targetWeekStructure.program_days?.length || 0;

    // Υπολογίζουμε πόσες ημερομηνίες έχουμε ήδη επιλέξει για αυτή την εβδομάδα
    let daysInPreviousWeeks = 0;
    for (let i = 0; i < targetWeek; i++) {
      daysInPreviousWeeks += weekStructure[i].program_days?.length || 0;
    }

    const daysInTargetWeekEnd = daysInPreviousWeeks + allowedDaysInWeek;
    const selectedDatesInTargetWeek = selectedDates
      .slice(daysInPreviousWeeks, Math.min(selectedDates.length, daysInTargetWeekEnd))
      .length;

    console.log('🗓️ [useTrainingDateLogic] canSelectDateInWeek:', {
      date: dateString,
      targetWeek,
      allowedDaysInWeek,
      selectedDatesInTargetWeek,
      daysInPreviousWeeks,
      canSelect: selectedDatesInTargetWeek < allowedDaysInWeek
    });

    return selectedDatesInTargetWeek < allowedDaysInWeek;
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
      if (canSelectDateInWeek(date)) {
        // Add date if not selected and within limits
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

    // ΝΕΑ ΛΟΓΙΚΗ: Χρήση της νέας συνάρτησης ελέγχου
    return !canSelectDateInWeek(date);
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
