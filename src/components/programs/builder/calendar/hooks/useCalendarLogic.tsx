
import { useState, useMemo } from 'react';
import { startOfWeek, format } from "date-fns";
import { formatDateForStorage, createDateForDisplay } from '@/utils/dateUtils';
import type { ProgramStructure } from '../../hooks/useProgramBuilderState';

export const useCalendarLogic = (
  program: ProgramStructure,
  totalDays: number,
  onTrainingDatesChange: (dates: Date[]) => void
) => {
  // Υπολογισμός ημερών ανά εβδομάδα από τη δομή του προγράμματος
  const getWeekDaysStructure = () => {
    if (!program.weeks || program.weeks.length === 0) return [];
    
    return program.weeks.map(week => ({
      weekNumber: week.week_number,
      daysCount: week.program_days?.length || 0,
      name: week.name || `Εβδομάδα ${week.week_number}`
    }));
  };

  const weekStructure = useMemo(() => getWeekDaysStructure(), [program.weeks]);

  // ΔΙΟΡΘΩΣΗ: Convert training_dates χρησιμοποιώντας τις νέες utility functions με σωστό type annotation
  const selectedDatesAsStrings = useMemo(() => {
    return (program.training_dates || []).map((date: Date | string) => {
      if (typeof date === 'string') {
        // Αν έχει timestamp, αφαιρούμε το
        const dateStr = date as string;
        return dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
      }
      // Χρησιμοποιούμε τη νέα function για σωστή μετατροπή
      return formatDateForStorage(date);
    });
  }, [program.training_dates]);

  // Ομαδοποίηση των επιλεγμένων ημερομηνιών ανά πραγματικές εβδομάδες ημερολογίου
  const getSelectedDatesPerCalendarWeek = () => {
    const selectedDates = selectedDatesAsStrings.map(dateStr => createDateForDisplay(dateStr));
    const weekCounts: { [key: string]: number } = {};
    
    selectedDates.forEach(date => {
      // Υπολογίζουμε την εβδομάδα ημερολογίου (Δευτέρα-Κυριακή)
      const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // 1 = Δευτέρα
      const weekKey = format(weekStart, 'yyyy-MM-dd');
      weekCounts[weekKey] = (weekCounts[weekKey] || 0) + 1;
    });
    
    return weekCounts;
  };

  // Εύρεση της επόμενης εβδομάδας που χρειάζεται συμπλήρωση
  const getCurrentWeekBeingFilled = () => {
    const selectedDates = selectedDatesAsStrings.map(dateStr => createDateForDisplay(dateStr));
    
    // Βρίσκουμε σε ποια εβδομάδα προγράμματος είμαστε
    let totalDaysAssigned = 0;
    for (let i = 0; i < weekStructure.length; i++) {
      const programWeek = weekStructure[i];
      const daysNeededForThisWeek = programWeek.daysCount;
      
      // Βρίσκουμε πόσες ημέρες έχουμε ήδη επιλέξει για αυτή την εβδομάδα προγράμματος
      const daysSelectedForThisWeek = selectedDates.slice(totalDaysAssigned, totalDaysAssigned + daysNeededForThisWeek).length;
      
      if (daysSelectedForThisWeek < daysNeededForThisWeek) {
        return {
          programWeekNumber: programWeek.weekNumber,
          weekStructure: programWeek,
          alreadySelected: daysSelectedForThisWeek,
          remainingForThisWeek: daysNeededForThisWeek - daysSelectedForThisWeek,
          totalDaysAssigned
        };
      }
      
      totalDaysAssigned += daysNeededForThisWeek;
    }
    
    return null; // Όλες οι εβδομάδες έχουν ολοκληρωθεί
  };

  const currentWeekInfo = useMemo(() => getCurrentWeekBeingFilled(), [selectedDatesAsStrings, weekStructure]);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date || !currentWeekInfo) return;
    
    // ΔΙΟΡΘΩΣΗ: Χρησιμοποιούμε τη νέα function για σωστή μετατροπή
    const dateString = formatDateForStorage(date);
    const currentDates = selectedDatesAsStrings.slice();
    
    console.log('📅 Date selection debug:', {
      originalDate: date,
      dateString: dateString,
      currentDates: currentDates
    });
    
    if (currentDates.includes(dateString)) {
      // Remove date if already selected
      const newDates = currentDates.filter(d => d !== dateString);
      const datesAsObjects = newDates.map(dateStr => createDateForDisplay(dateStr));
      onTrainingDatesChange(datesAsObjects);
    } else if (currentWeekInfo.remainingForThisWeek > 0) {
      // Add date if there's still room in the current program week
      const newDates = [...currentDates, dateString].sort();
      const datesAsObjects = newDates.map(dateStr => createDateForDisplay(dateStr));
      onTrainingDatesChange(datesAsObjects);
    }
  };

  const handleClearAllDates = () => {
    onTrainingDatesChange([]);
  };

  const isDateSelected = (date: Date) => {
    const dateString = formatDateForStorage(date);
    return selectedDatesAsStrings.includes(dateString);
  };

  const isDateDisabled = (date: Date) => {
    // Αφαίρεση του περιορισμού για παλιές ημερομηνίες
    // Επιτρέπουμε όλες τις ημερομηνίες
    
    // If date is already selected, allow it (for deselection)
    if (isDateSelected(date)) return false;

    // If no current week is being filled, disable all dates
    if (!currentWeekInfo) return true;

    // Don't allow more selections if current program week is full
    return currentWeekInfo.remainingForThisWeek <= 0;
  };

  const getWeekProgress = () => {
    const selectedDates = selectedDatesAsStrings.map(dateStr => createDateForDisplay(dateStr));
    
    let totalDaysAssigned = 0;
    return weekStructure.map((week) => {
      const daysNeededForThisWeek = week.daysCount;
      const daysSelectedForThisWeek = selectedDates.slice(totalDaysAssigned, totalDaysAssigned + daysNeededForThisWeek).length;
      
      const result = {
        weekIndex: week.weekNumber,
        weekName: week.name,
        selected: daysSelectedForThisWeek,
        required: daysNeededForThisWeek,
        completed: daysSelectedForThisWeek >= daysNeededForThisWeek
      };
      
      totalDaysAssigned += daysNeededForThisWeek;
      return result;
    });
  };

  const weekProgress = useMemo(() => getWeekProgress(), [selectedDatesAsStrings, weekStructure]);

  return {
    weekStructure,
    selectedDatesAsStrings,
    currentWeekInfo,
    weekProgress,
    handleDateSelect,
    handleClearAllDates,
    isDateSelected,
    isDateDisabled
  };
};
