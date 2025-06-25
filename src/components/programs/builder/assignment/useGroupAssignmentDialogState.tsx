
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User as UserType } from '../../types';
import type { ProgramStructure } from '../hooks/useProgramBuilderState';

interface Group {
  id: string;
  name: string;
  description?: string;
  member_count?: number;
}

interface UseGroupAssignmentDialogStateProps {
  isOpen: boolean;
  program: ProgramStructure;
  users: UserType[];
  editingAssignment?: {
    user_id: string;
    training_dates: string[];
    completedDates?: string[];
  };
}

export const useGroupAssignmentDialogState = ({
  isOpen,
  program,
  users,
  editingAssignment
}: UseGroupAssignmentDialogStateProps) => {
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [assignmentType, setAssignmentType] = useState<'individual' | 'group'>('individual');
  const [isReassignment, setIsReassignment] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  // Fetch groups on dialog open
  useEffect(() => {
    if (isOpen) {
      fetchGroups();
    }
  }, [isOpen]);

  const fetchGroups = async () => {
    setLoadingGroups(true);
    try {
      const { data: groupsData, error } = await supabase
        .from('groups')
        .select(`
          id,
          name,
          description,
          group_members!inner(id)
        `);

      if (error) {
        console.error('Error fetching groups:', error);
        return;
      }

      const groupsWithMemberCount = groupsData?.map(group => ({
        id: group.id,
        name: group.name,
        description: group.description,
        member_count: group.group_members?.length || 0
      })) || [];

      setGroups(groupsWithMemberCount);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoadingGroups(false);
    }
  };

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      if (editingAssignment) {
        setSelectedUserId(editingAssignment.user_id);
        setSelectedDates([...editingAssignment.training_dates]);
        setAssignmentType('individual'); // Group editing not supported yet
        setIsReassignment(false);
      } else {
        setSelectedUserId('');
        setSelectedGroupId('');
        setSelectedDates([]);
        setAssignmentType('individual');
        setIsReassignment(false);
      }
    }
  }, [isOpen, editingAssignment]);

  // Calculate program requirements
  const { totalRequiredSessions, totalWeeks, daysPerWeek } = useMemo(() => {
    const weeks = program.weeks || [];
    const totalWeeks = weeks.length;
    const daysPerWeek = weeks[0]?.program_days?.length || 0;
    const totalRequiredSessions = totalWeeks * daysPerWeek;

    return {
      totalRequiredSessions,
      totalWeeks,
      daysPerWeek
    };
  }, [program.weeks]);

  // Get selected objects
  const selectedUser = users.find(user => user.id === selectedUserId);
  const selectedGroup = groups.find(group => group.id === selectedGroupId);

  // Completed dates (for editing assignments)
  const completedDates = editingAssignment?.completedDates || [];

  // Helper functions
  const removeSelectedDate = (dateToRemove: string) => {
    setSelectedDates(prev => prev.filter(date => date !== dateToRemove));
  };

  const handleDateSelect = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    
    if (selectedDates.includes(dateStr)) {
      removeSelectedDate(dateStr);
    } else {
      if (selectedDates.length < totalRequiredSessions) {
        setSelectedDates(prev => [...prev, dateStr].sort());
      }
    }
  };

  const clearAllDates = () => {
    setSelectedDates([]);
  };

  const handleReassignmentToggle = (checked: boolean) => {
    setIsReassignment(checked);
    if (checked) {
      // When enabling reassignment, clear all dates except completed ones
      setSelectedDates([]);
    } else {
      // When disabling reassignment, restore original dates
      if (editingAssignment) {
        setSelectedDates([...editingAssignment.training_dates]);
      }
    }
  };

  const isDateSelected = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return selectedDates.includes(dateStr);
  };

  const isDateDisabled = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    
    // Disable past dates unless they're already selected or completed
    if (dateStr < today && !selectedDates.includes(dateStr) && !completedDates.includes(dateStr)) {
      return true;
    }
    
    // If reassignment is disabled, don't allow changing completed dates
    if (!isReassignment && completedDates.includes(dateStr)) {
      return true;
    }
    
    return false;
  };

  return {
    selectedDates,
    selectedUserId,
    selectedGroupId,
    assignmentType,
    isReassignment,
    groups,
    loadingGroups,
    selectedUser,
    selectedGroup,
    completedDates,
    totalRequiredSessions,
    totalWeeks,
    daysPerWeek,
    setSelectedUserId,
    setSelectedGroupId,
    setAssignmentType,
    removeSelectedDate,
    handleDateSelect,
    clearAllDates,
    handleReassignmentToggle,
    isDateSelected,
    isDateDisabled
  };
};
