
import { useState, useMemo } from 'react';
import { isSameWeek } from "date-fns";

interface UseCalendarLogicProps {
  selectedDates: Date[];
  onDatesChange: (dates: Date[]) => void;
  totalDays: number;
  weeks: any[];
}

export const useCalendarLogic = ({
  selectedDates,
  onDatesChange,
  totalDays,
  weeks = []
}: UseCalendarLogicProps) => {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);

  // Υπολογίζουμε τη δομή των εβδομάδων από το πρόγραμμα
  const weekStructure = useMemo(() => {
    return weeks.map(week => ({
      weekNumber: week.week_number || 1,
      daysCount: week.days?.length || 0
    }));
  }, [weeks]);

  const validateWeekSelection = (newDate: Date): boolean => {
    if (weekStructure.length === 0) return true;
    if (selectedDates.length === 0) return true;

    const currentWeek = weekStructure[currentWeekIndex];
    if (!currentWeek) return false;

    // Βρίσκουμε τις ημερομηνίες της τρέχουσας εβδομάδας που επεξεργαζόμαστε
    const currentWeekDates = getCurrentWeekDates();
    
    // Αν η τρέχουσα εβδομάδα δεν έχει συμπληρωθεί
    if (currentWeekDates.length < currentWeek.daysCount) {
      // Ελέγχουμε αν η νέα ημερομηνία είναι στην ίδια εβδομάδα με τις τρέχουσες
      if (currentWeekDates.length > 0) {
        const firstDateOfCurrentWeek = currentWeekDates[0];
        return isSameWeek(newDate, firstDateOfCurrentWeek, { weekStartsOn: 0 });
      }
      return true;
    }

    // Αν η τρέχουσα εβδομάδα έχει συμπληρωθεί, πάμε στην επόμενη
    return true;
  };

  const getCurrentWeekDates = (): Date[] => {
    if (selectedDates.length === 0) return [];
    
    let totalProcessedDays = 0;
    for (let i = 0; i < currentWeekIndex; i++) {
      totalProcessedDays += weekStructure[i]?.daysCount || 0;
    }
    
    const currentWeekStartIndex = totalProcessedDays;
    const currentWeek = weekStructure[currentWeekIndex];
    const currentWeekEndIndex = currentWeekStartIndex + (currentWeek?.daysCount || 0);
    
    return selectedDates.slice(currentWeekStartIndex, currentWeekEndIndex);
  };

  const updateWeekIndex = (dates: Date[]) => {
    if (weekStructure.length === 0) return;
    
    let totalDays = 0;
    let weekIndex = 0;
    
    for (let i = 0; i < weekStructure.length; i++) {
      const weekDays = weekStructure[i].daysCount;
      if (dates.length <= totalDays + weekDays) {
        weekIndex = i;
        break;
      }
      totalDays += weekDays;
      weekIndex = i + 1;
    }
    
    setCurrentWeekIndex(Math.min(weekIndex, weekStructure.length - 1));
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    const dateExists = selectedDates.some(d => 
      d.toDateString() === date.toDateString()
    );
    
    if (dateExists) {
      // Αφαίρεση ημερομηνίας
      const newDates = selectedDates.filter(d => 
        d.toDateString() !== date.toDateString()
      );
      onDatesChange(newDates);
      
      // Επαναυπολογισμός του index εβδομάδας
      updateWeekIndex(newDates);
      return;
    }

    // Έλεγχος αν έχουμε φτάσει το όριο
    if (selectedDates.length >= totalDays) {
      console.log(`⚠️ Μπορείς να επιλέξεις μόνο ${totalDays} ημερομηνίες`);
      return;
    }

    // Λογική για επιλογή ημερομηνιών βάσει δομής εβδομάδων
    if (weekStructure.length > 0) {
      const canAddToCurrentWeek = validateWeekSelection(date);
      if (!canAddToCurrentWeek) {
        console.log('⚠️ Πρέπει να ολοκληρώσεις τις ημέρες της τρέχουσας εβδομάδας πρώτα');
        return;
      }
    }
    
    // Προσθήκη ημερομηνίας
    const newDates = [...selectedDates, date].sort((a, b) => a.getTime() - b.getTime());
    onDatesChange(newDates);
    
    // Ενημέρωση του index εβδομάδας
    updateWeekIndex(newDates);
  };

  const removeDate = (dateToRemove: Date) => {
    const newDates = selectedDates.filter(d => 
      d.toDateString() !== dateToRemove.toDateString()
    );
    onDatesChange(newDates);
    updateWeekIndex(newDates);
  };

  const clearAllDates = () => {
    onDatesChange([]);
    setCurrentWeekIndex(0);
  };

  // Ενημέρωση για την τρέχουσα εβδομάδα
  const getCurrentWeekInfo = () => {
    if (weekStructure.length === 0) return null;
    
    const currentWeek = weekStructure[currentWeekIndex];
    const currentWeekDates = getCurrentWeekDates();
    
    return {
      weekNumber: currentWeek?.weekNumber || currentWeekIndex + 1,
      remainingDays: (currentWeek?.daysCount || 0) - currentWeekDates.length,
      totalDaysInWeek: currentWeek?.daysCount || 0,
      selectedInWeek: currentWeekDates.length
    };
  };

  return {
    calendarOpen,
    setCalendarOpen,
    weekStructure,
    handleDateSelect,
    removeDate,
    clearAllDates,
    validateWeekSelection,
    getCurrentWeekInfo: getCurrentWeekInfo()
  };
};
