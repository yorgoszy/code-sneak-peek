
import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { supabase } from "@/integrations/supabase/client";
import type { User as UserType } from '../../types';
import type { ProgramStructure } from '../hooks/useProgramBuilderState';

interface UseMultipleUserAssignmentStateProps {
  isOpen: boolean;
  program: ProgramStructure;
  users: UserType[];
  editingAssignment?: {
    user_id: string;
    training_dates: string[];
    completedDates?: string[];
  };
}

export const useMultipleUserAssignmentState = ({
  isOpen,
  program,
  users,
  editingAssignment
}: UseMultipleUserAssignmentStateProps) => {
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Calculate program requirements
  const totalWeeks = program.weeks?.length || 0;
  const daysPerWeek = program.weeks?.[0]?.program_days?.length || 0;
  const totalRequiredSessions = totalWeeks * daysPerWeek;

  // Handle user selection
  const handleUserToggle = (userId: string) => {
    setSelectedUserIds(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleClearAllUsers = () => {
    setSelectedUserIds([]);
  };

  // Handle date selection - convert Date to string and set time to noon
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    // Set the time to 12:00 PM (noon) to avoid timezone issues
    const adjustedDate = new Date(date);
    adjustedDate.setHours(12, 0, 0, 0);
    
    const dateStr = format(adjustedDate, 'yyyy-MM-dd');
    setSelectedDates(prev => {
      if (prev.includes(dateStr)) {
        return prev.filter(d => d !== dateStr);
      } else if (prev.length < totalRequiredSessions) {
        return [...prev, dateStr].sort();
      }
      return prev;
    });
  };

  const removeSelectedDate = (dateStr: string) => {
    setSelectedDates(prev => prev.filter(d => d !== dateStr));
  };

  const clearAllDates = () => {
    setSelectedDates([]);
  };

  // Check if date is selected - convert Date to string for comparison
  const isDateSelected = (date: Date) => {
    const adjustedDate = new Date(date);
    adjustedDate.setHours(12, 0, 0, 0);
    const dateStr = format(adjustedDate, 'yyyy-MM-dd');
    return selectedDates.includes(dateStr);
  };

  // Check if date should be disabled - convert Date to string for comparison
  const isDateDisabled = (date: Date) => {
    const adjustedDate = new Date(date);
    adjustedDate.setHours(12, 0, 0, 0);
    const dateStr = format(adjustedDate, 'yyyy-MM-dd');
    return !selectedDates.includes(dateStr) && selectedDates.length >= totalRequiredSessions;
  };

  // Reset when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      if (editingAssignment) {
        setSelectedUserIds([editingAssignment.user_id]);
        setSelectedDates(editingAssignment.training_dates || []);
      } else {
        setSelectedUserIds([]);
        setSelectedDates([]);
      }
    }
  }, [isOpen, editingAssignment]);

  const selectedUsers = useMemo(() => {
    return users.filter(user => selectedUserIds.includes(user.id));
  }, [users, selectedUserIds]);

  return {
    selectedDates,
    selectedUserIds,
    selectedUsers,
    totalRequiredSessions,
    totalWeeks,
    daysPerWeek,
    handleUserToggle,
    handleClearAllUsers,
    handleDateSelect,
    removeSelectedDate,
    clearAllDates,
    isDateSelected,
    isDateDisabled
  };
};
