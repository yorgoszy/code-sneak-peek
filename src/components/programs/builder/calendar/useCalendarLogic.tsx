
import { useState, useMemo } from 'react';
import { formatDateToLocalString } from '@/utils/dateUtils';

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
  weeks
}: UseCalendarLogicProps) => {
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Δημιουργία δομής εβδομάδων
  const weekStructure = useMemo(() => {
    if (!weeks || weeks.length === 0) return [];
    
    return weeks.map((week, weekIndex) => ({
      weekNumber: week.week_number || weekIndex + 1,
      daysInWeek: week.days?.length || 0,
      totalDaysBeforeWeek: weeks.slice(0, weekIndex).reduce((sum, w) => sum + (w.days?.length || 0), 0)
    }));
  }, [weeks]);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    // Βεβαιωνόμαστε ότι η ημερομηνία είναι στην τοπική ζώνη ώρας
    const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    const isAlreadySelected = selectedDates.some(selectedDate => {
      const selectedLocal = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
      return selectedLocal.getTime() === localDate.getTime();
    });

    if (isAlreadySelected) {
      // Αφαίρεση ημερομηνίας
      const newDates = selectedDates.filter(selectedDate => {
        const selectedLocal = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
        return selectedLocal.getTime() !== localDate.getTime();
      });
      onDatesChange(newDates);
    } else if (selectedDates.length < totalDays) {
      // Προσθήκη ημερομηνίας
      onDatesChange([...selectedDates, localDate].sort((a, b) => a.getTime() - b.getTime()));
    }
  };

  const removeDate = (dateToRemove: Date) => {
    const dateToRemoveLocal = new Date(dateToRemove.getFullYear(), dateToRemove.getMonth(), dateToRemove.getDate());
    const newDates = selectedDates.filter(date => {
      const dateLocal = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      return dateLocal.getTime() !== dateToRemoveLocal.getTime();
    });
    onDatesChange(newDates);
  };

  const clearAllDates = () => {
    onDatesChange([]);
  };

  const validateWeekSelection = (date: Date) => {
    if (weekStructure.length === 0) return true;
    
    // Επιτρέπουμε όλες τις ημερομηνίες για απλότητα
    // Μπορούμε να προσθέσουμε πιο σύνθετη λογική αργότερα
    return selectedDates.length < totalDays;
  };

  const getCurrentWeekInfo = () => {
    if (weekStructure.length === 0 || selectedDates.length === 0) return null;

    // Βρίσκουμε σε ποια εβδομάδα ανήκει η τελευταία επιλεγμένη ημερομηνία
    const sortedDates = [...selectedDates].sort((a, b) => a.getTime() - b.getTime());
    const currentIndex = sortedDates.length - 1;

    let currentWeekIndex = 0;
    let daysCount = 0;

    for (let i = 0; i < weekStructure.length; i++) {
      if (daysCount + weekStructure[i].daysInWeek > currentIndex) {
        currentWeekIndex = i;
        break;
      }
      daysCount += weekStructure[i].daysInWeek;
    }

    const currentWeek = weekStructure[currentWeekIndex];
    const selectedInWeek = Math.min(sortedDates.length - daysCount, currentWeek.daysInWeek);
    const remainingInWeek = currentWeek.daysInWeek - selectedInWeek;

    return {
      weekNumber: currentWeek.weekNumber,
      remainingDays: remainingInWeek,
      totalDaysInWeek: currentWeek.daysInWeek,
      selectedInWeek: selectedInWeek
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
