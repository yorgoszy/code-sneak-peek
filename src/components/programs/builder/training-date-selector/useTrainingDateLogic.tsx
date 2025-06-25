
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
      console.log('🗓️ [useTrainingDateLogic] No date provided');
      return;
    }
    
    console.log('🗓️ [useTrainingDateLogic] Raw selected date:', date);
    console.log('🗓️ [useTrainingDateLogic] Date details:', {
      year: date.getFullYear(),
      month: date.getMonth(),
      day: date.getDate(),
      toString: date.toString(),
      toISOString: date.toISOString()
    });
    
    // Δημιουργούμε καθαρή ημερομηνία χωρίς ώρα
    const cleanDate = createDateFromCalendar(date);
    console.log('🗓️ [useTrainingDateLogic] Clean date after createDateFromCalendar:', cleanDate);
    
    const dateString = formatDateToLocalString(cleanDate);
    console.log('🗓️ [useTrainingDateLogic] Formatted date string:', dateString);
    
    console.log('🗓️ [useTrainingDateLogic] Current selectedDates:', selectedDates);
    
    if (selectedDates.includes(dateString)) {
      // Αφαίρεση ημερομηνίας
      const newDates = selectedDates.filter(d => d !== dateString);
      console.log('🗓️ [useTrainingDateLogic] Removing date. New dates:', newDates);
      onDatesChange(newDates);
    } else {
      // Έλεγχος αν μπορούμε να προσθέσουμε την ημερομηνία
      const canAdd = canAddDate(dateString);
      console.log('🗓️ [useTrainingDateLogic] Can add date?', canAdd);
      
      if (canAdd) {
        const newDates = [...selectedDates, dateString].sort();
        console.log('🗓️ [useTrainingDateLogic] Adding date. New dates:', newDates);
        onDatesChange(newDates);
      } else {
        console.log('🗓️ [useTrainingDateLogic] Cannot add date - limit reached for this week');
      }
    }
  };

  const canAddDate = (newDateString: string): boolean => {
    console.log('🗓️ [canAddDate] Checking if can add date:', newDateString);
    console.log('🗓️ [canAddDate] Current selectedDates:', selectedDates);
    console.log('🗓️ [canAddDate] Week structure:', weekStructure);
    
    // Έλεγχος συνολικού ορίου πρώτα
    if (selectedDates.length >= totalRequiredDays) {
      console.log('🗓️ [canAddDate] Total limit reached:', selectedDates.length, '>=', totalRequiredDays);
      return false;
    }

    // Αν δεν έχουμε δομή εβδομάδων, επιτρέπουμε επιλογή μέχρι το συνολικό όριο
    if (weekStructure.length === 0) {
      console.log('🗓️ [canAddDate] No week structure, allowing selection');
      return true;
    }

    // Δημιουργούμε προσωρινό ταξινομημένο array με τη νέα ημερομηνία
    const tempDates = [...selectedDates, newDateString].sort();
    console.log('🗓️ [canAddDate] Temp dates array (sorted):', tempDates);
    
    const newDateIndex = tempDates.indexOf(newDateString);
    console.log('🗓️ [canAddDate] New date index in sorted array:', newDateIndex);
    
    // Βρίσκουμε σε ποια εβδομάδα του προγράμματος ανήκει αυτή η ημερομηνία
    const targetWeek = getWeekForDateIndex(newDateIndex);
    console.log('🗓️ [canAddDate] Target week for index', newDateIndex, ':', targetWeek);
    
    if (!targetWeek) {
      console.log('🗓️ [canAddDate] No target week found');
      return false;
    }

    // Μετράμε πόσες ημερομηνίες είναι ήδη επιλεγμένες για αυτή την εβδομάδα του προγράμματος
    const currentCountInWeek = getSelectedDatesInWeek(targetWeek.weekNumber);
    console.log('🗓️ [canAddDate] Current selected dates in week', targetWeek.weekNumber, ':', currentCountInWeek);
    console.log('🗓️ [canAddDate] Max allowed in this week:', targetWeek.daysInWeek);
    
    const canAddToWeek = currentCountInWeek < targetWeek.daysInWeek;
    console.log('🗓️ [canAddDate] Can add to week?', canAddToWeek);
    
    return canAddToWeek;
  };

  // Βοηθητική συνάρτηση για να βρούμε σε ποια εβδομάδα του προγράμματος ανήκει μια ημερομηνία
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

  // Βοηθητική συνάρτηση για να μετρήσουμε τις επιλεγμένες ημερομηνίες σε μια συγκεκριμένη εβδομάδα
  const getSelectedDatesInWeek = (weekNumber: number): number => {
    const sortedDates = [...selectedDates].sort();
    let count = 0;
    let currentIndex = 0;
    
    for (const week of weekStructure) {
      if (week.weekNumber === weekNumber) {
        // Μετράμε πόσες ημερομηνίες είναι επιλεγμένες στο εύρος αυτής της εβδομάδας
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

  const removeDate = (dateToRemove: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    console.log('🗓️ [removeDate] Removing date:', dateToRemove);
    console.log('🗓️ [removeDate] Current selectedDates:', selectedDates);
    
    const newDates = selectedDates.filter(d => d !== dateToRemove);
    console.log('🗓️ [removeDate] New dates after removal:', newDates);
    onDatesChange(newDates);
  };

  const clearAllDates = () => {
    console.log('🗓️ [clearAllDates] Clearing all dates');
    onDatesChange([]);
  };

  const isDateSelected = (date: Date) => {
    const cleanDate = createDateFromCalendar(date);
    const dateString = formatDateToLocalString(cleanDate);
    const isSelected = selectedDates.includes(dateString);
    
    // Logging μόνο για debugging
    if (isSelected) {
      console.log('🗓️ [isDateSelected] Date is selected:', dateString);
    }
    
    return isSelected;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const isDateDisabled = (date: Date) => {
    // Απενεργοποίηση παλιών ημερομηνιών
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return true;

    // Αν η ημερομηνία είναι ήδη επιλεγμένη, επιτρέπουμε την (για αποεπιλογή)
    if (isDateSelected(date)) return false;

    // Έλεγχος αν μπορούμε να προσθέσουμε αυτή την ημερομηνία βάσει της δομής εβδομάδων
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
