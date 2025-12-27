
import { useState, useMemo } from 'react';
import { startOfWeek, format } from "date-fns";
import { formatDateForStorage, createDateForDisplay } from '@/utils/dateUtils';
import type { ProgramStructure } from '../../hooks/useProgramBuilderState';

export const useCalendarLogic = (
  program: ProgramStructure,
  totalDays: number,
  onTrainingDatesChange: (dates: Date[]) => void
) => {
  // Υπολογισμός εβδομαδιαίας δομής για την ανάθεση ημερομηνιών.
  // ΣΗΜΑΝΤΙΚΟ: Το totalDays αφορά το ΠΟΣΕΣ προπονήσεις θα ανατεθούν συνολικά (π.χ. 12),
  // και μπορεί να είναι μεγαλύτερο από τις ημέρες που υπάρχουν σε μία "template" εβδομάδα.
  const getWeekDaysStructure = () => {
    const templateDaysPerWeek = program.weeks?.[0]?.program_days?.length || 0;
    const daysPerWeek = Math.max(1, templateDaysPerWeek);

    if (!totalDays || totalDays <= 0) return [];

    const totalWeeks = Math.ceil(totalDays / daysPerWeek);

    return Array.from({ length: totalWeeks }, (_, i) => {
      const remaining = totalDays - i * daysPerWeek;
      const weekDaysCount = Math.max(0, Math.min(daysPerWeek, remaining));

      return {
        weekNumber: i + 1,
        daysCount: weekDaysCount,
        name: `Εβδομάδα ${i + 1}`
      };
    }).filter(w => w.daysCount > 0);
  };

  const weekStructure = useMemo(() => getWeekDaysStructure(), [program.weeks, totalDays]);

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
    if (!date) return;

    const dateString = formatDateForStorage(date);
    const currentDates = selectedDatesAsStrings.slice();

    console.log('📅 Date selection debug:', {
      originalDate: date,
      dateString,
      currentDates,
      totalDays
    });

    if (currentDates.includes(dateString)) {
      const newDates = currentDates.filter(d => d !== dateString);
      const datesAsObjects = newDates.map(dateStr => createDateForDisplay(dateStr));
      onTrainingDatesChange(datesAsObjects);
      return;
    }

    // επιτρέπουμε επιλογές μέχρι να συμπληρωθούν totalDays συνολικά
    if (currentDates.length >= totalDays) return;

    const newDates = [...currentDates, dateString].sort();
    const datesAsObjects = newDates.map(dateStr => createDateForDisplay(dateStr));
    onTrainingDatesChange(datesAsObjects);
  };

  const handleClearAllDates = () => {
    onTrainingDatesChange([]);
  };


  const isDateSelected = (date: Date) => {
    const dateString = formatDateForStorage(date);
    return selectedDatesAsStrings.includes(dateString);
  };

  const isDateDisabled = (date: Date) => {
    // If date is already selected, allow it (for deselection)
    if (isDateSelected(date)) return false;

    // Μόνο όριο στο πλήθος συνολικών προπονήσεων
    return selectedDatesAsStrings.length >= totalDays;
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

  // Συνάρτηση για να βρούμε τι τύπος ημέρας είναι (test/competition) μια επιλεγμένη ημερομηνία
  // Σε "template" πρόγραμμα (π.χ. 1 εβδομάδα), επαναλαμβάνουμε τα day flags ανά εβδομάδα.
  const getDayInfoForDate = (date: Date) => {
    const dateString = formatDateForStorage(date);
    const dateIndex = selectedDatesAsStrings.indexOf(dateString);

    if (dateIndex === -1) return null;

    const templateWeek = program.weeks?.[0];
    const templateDays = templateWeek?.program_days || [];
    const templateDaysPerWeek = Math.max(1, templateDays.length);

    const dayIndexInTemplate = dateIndex % templateDaysPerWeek;
    const day = templateDays[dayIndexInTemplate];

    return {
      is_test_day: day?.is_test_day || false,
      test_types: day?.test_types || [],
      is_competition_day: day?.is_competition_day || false
    };
  };

  return {
    weekStructure,
    selectedDatesAsStrings,
    currentWeekInfo,
    weekProgress,
    handleDateSelect,
    handleClearAllDates,
    isDateSelected,
    isDateDisabled,
    getDayInfoForDate
  };
};
