
import { useState, useEffect } from 'react';
import { format, parseISO, getWeek, getYear } from "date-fns";
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

  // Υπολογισμός απαιτούμενων προπονήσεων
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
    
    if (canAddDate(date)) {
      setSelectedDates([...selectedDates, dateString].sort());
    }
  };

  const canAddDate = (date: Date): boolean => {
    if (selectedDates.length >= totalRequiredSessions) {
      return false;
    }
    
    const weekNumber = getWeek(date, { weekStartsOn: 1, firstWeekContainsDate: 4 });
    const year = getYear(date);
    
    const datesInThisWeek = selectedDates.filter(selectedDate => {
      const selectedDateObj = parseISO(selectedDate);
      const selectedWeek = getWeek(selectedDateObj, { weekStartsOn: 1, firstWeekContainsDate: 4 });
      const selectedYear = getYear(selectedDateObj);
      return selectedWeek === weekNumber && selectedYear === year;
    });
    
    return datesInThisWeek.length < daysPerWeek;
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
    if (date < new Date(new Date().setHours(0, 0, 0, 0))) {
      return true;
    }
    
    const dateString = format(date, 'yyyy-MM-dd');
    
    if (selectedDates.includes(dateString)) {
      return false;
    }

    if (completedDates.includes(dateString) && !isReassignment) {
      return true;
    }
    
    return !canAddDate(date);
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
