import { useState, useEffect, useMemo } from 'react';
import { format, addDays, parseISO } from 'date-fns';
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

  // Helper function για σωστή μετατροπή ημερομηνιών χωρίς timezone issues
  const formatDateToString = (date: Date): string => {
    // Χρησιμοποιούμε την τοπική ημερομηνία του χρήστη
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  };

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      if (editingAssignment) {
        setSelectedDates(editingAssignment.training_dates || []);
        setSelectedUserId(editingAssignment.user_id || '');
        setIsReassignment(false);
      } else {
        setSelectedDates([]);
        setSelectedUserId('');
        setIsReassignment(false);
      }
    }
  }, [isOpen, editingAssignment]);

  const selectedUser = useMemo(() => {
    return users.find(user => user.id === selectedUserId) || null;
  }, [users, selectedUserId]);

  // Completed dates from editing assignment
  const completedDates = useMemo(() => {
    return editingAssignment?.completedDates || [];
  }, [editingAssignment]);

  // Calculate program requirements
  const totalRequiredSessions = useMemo(() => {
    return program.weeks?.reduce((total, week) => total + (week.program_days?.length || 0), 0) || 0;
  }, [program.weeks]);

  const totalWeeks = program.weeks?.length || 0;
  const daysPerWeek = program.weeks?.[0]?.program_days?.length || 0;

  const removeSelectedDate = (dateToRemove: string) => {
    setSelectedDates(prev => prev.filter(date => date !== dateToRemove));
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    const dateString = formatDateToString(date);
    
    console.log('📅 Date selection:', {
      originalDate: date,
      dateString: dateString
    });
    
    setSelectedDates(prev => {
      if (prev.includes(dateString)) {
        // Remove date if already selected
        return prev.filter(d => d !== dateString);
      } else {
        // Add date if not selected and under limit
        if (prev.length < totalRequiredSessions) {
          return [...prev, dateString].sort();
        }
        return prev;
      }
    });
  };

  const clearAllDates = () => {
    // Keep only completed dates if in editing mode and not reassigning
    if (editingAssignment && !isReassignment) {
      setSelectedDates(completedDates);
    } else {
      setSelectedDates([]);
    }
  };

  const handleReassignmentToggle = (enabled: boolean) => {
    setIsReassignment(enabled);
    if (enabled) {
      // Clear all dates for fresh assignment
      setSelectedDates([]);
    } else if (editingAssignment) {
      // Restore original dates
      setSelectedDates(editingAssignment.training_dates || []);
    }
  };

  const isDateSelected = (date: Date) => {
    const dateString = formatDateToString(date);
    return selectedDates.includes(dateString);
  };

  const isDateDisabled = (date: Date) => {
    // Disable past dates for new assignments
    if (!editingAssignment || isReassignment) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);
      return checkDate < today;
    }
    
    // For editing existing assignments, don't disable any dates
    return false;
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
