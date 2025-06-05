
import { useState, useEffect } from 'react';
import { format, parseISO, getWeek, getYear, startOfWeek, endOfWeek } from "date-fns";
import type { User as UserType } from '../../types';
import type { ProgramStructure } from '../hooks/useProgramBuilderState';

interface UseAssignmentDialogStateProps {
  isOpen: boolean;
  program: ProgramStructure;
  users: UserType[];
  editingAssignment?: {
    user_id: string;
    training_dates: string[];
    completedDates?: string[];
  };
}

export const useAssignmentDialogState = ({
  isOpen,
  program,
  users,
  editingAssignment
}: UseAssignmentDialogStateProps) => {
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [isReassignment, setIsReassignment] = useState(false);

  // Υπολογισμός προγράμματος
  const totalWeeks = program.weeks?.length || 0;
  const daysPerWeek = program.weeks?.[0]?.days?.length || 0;
  const totalRequiredSessions = totalWeeks * daysPerWeek;

  const selectedUser = users.find(user => user.id === selectedUserId);
  const completedDates = editingAssignment?.completedDates || [];

  useEffect(() => {
    if (!isOpen) {
      setSelectedDates([]);
      setSelectedUserId('');
      setIsReassignment(false);
    } else {
      if (editingAssignment) {
        setSelectedUserId(editingAssignment.user_id);
        if (!isReassignment) {
          setSelectedDates(editingAssignment.training_dates || []);
        }
      } else if (program.user_id) {
        setSelectedUserId(program.user_id);
      }
    }
  }, [isOpen, program.user_id, editingAssignment, isReassignment]);

  const removeSelectedDate = (dateToRemove: string) => {
    if (!completedDates.includes(dateToRemove)) {
      setSelectedDates(selectedDates.filter(date => date !== dateToRemove));
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    const dateString = format(date, 'yyyy-MM-dd');
    
    if (completedDates.includes(dateString) && !isReassignment) {
      return;
    }
    
    if (selectedDates.includes(dateString)) {
      setSelectedDates(selectedDates.filter(d => d !== dateString));
      return;
    }
    
    if (canAddDateToWeek(date)) {
      setSelectedDates([...selectedDates, dateString].sort());
    }
  };

  const canAddDateToWeek = (date: Date): boolean => {
    if (selectedDates.length >= totalRequiredSessions) {
      return false;
    }
    
    // Βρίσκουμε ποια εβδομάδα είναι (0-based index)
    const weekIndex = getWeekIndexForDate(date);
    if (weekIndex === -1) return false;
    
    // Υπολογίζουμε πόσες προπονήσεις έχει η εβδομάδα αυτή
    const weekDaysCount = program.weeks?.[weekIndex]?.days?.length || 0;
    
    // Μετράμε πόσες ημερομηνίες έχουμε ήδη επιλέξει για αυτή την εβδομάδα
    const weekStart = startOfWeek(date, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
    
    const datesInThisWeek = selectedDates.filter(selectedDate => {
      const selectedDateObj = parseISO(selectedDate);
      return selectedDateObj >= weekStart && selectedDateObj <= weekEnd;
    });
    
    return datesInThisWeek.length < weekDaysCount;
  };

  const getWeekIndexForDate = (date: Date): number => {
    // Εδώ πρέπει να υπολογίσουμε ποια εβδομάδα του προγράμματος είναι
    // Για απλότητα, θα χρησιμοποιήσουμε τη σειρά των εβδομάδων
    if (!program.weeks || program.weeks.length === 0) return -1;
    
    // Αν έχουμε ήδη επιλεγμένες ημερομηνίες, βρίσκουμε την πρώτη
    if (selectedDates.length > 0) {
      const sortedDates = [...selectedDates].sort();
      const firstDate = parseISO(sortedDates[0]);
      
      // Υπολογίζουμε τη διαφορά εβδομάδων
      const weeksDiff = Math.floor((date.getTime() - firstDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
      return Math.max(0, Math.min(weeksDiff, program.weeks.length - 1));
    }
    
    // Αν δεν έχουμε επιλεγμένες ημερομηνίες, αρχίζουμε από την πρώτη εβδομάδα
    return 0;
  };

  const clearAllDates = () => {
    if (!isReassignment) {
      setSelectedDates(selectedDates.filter(date => completedDates.includes(date)));
    } else {
      setSelectedDates([]);
    }
  };

  const handleReassignmentToggle = (checked: boolean) => {
    setIsReassignment(checked);
    if (checked) {
      setSelectedDates([]);
    } else if (editingAssignment) {
      setSelectedDates(editingAssignment.training_dates || []);
    }
  };

  const isDateSelected = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return selectedDates.includes(dateString);
  };

  const isDateDisabled = (date: Date) => {
    // ΑΦΑΙΡΟΥΜΕ τον περιορισμό για προηγούμενες ημερομηνίες
    // Επιτρέπουμε όλες τις ημερομηνίες (παρελθόν, παρόν, μέλλον)
    
    const dateString = format(date, 'yyyy-MM-dd');
    
    if (selectedDates.includes(dateString)) {
      return false;
    }

    if (completedDates.includes(dateString) && !isReassignment) {
      return true;
    }
    
    return !canAddDateToWeek(date);
  };

  return {
    selectedDates,
    selectedUserId,
    isReassignment,
    selectedUser,
    completedDates,
    totalRequiredSessions,
    totalWeeks,
    daysPerWeek,
    setSelectedUserId,
    removeSelectedDate,
    handleDateSelect,
    clearAllDates,
    handleReassignmentToggle,
    isDateSelected,
    isDateDisabled
  };
};
