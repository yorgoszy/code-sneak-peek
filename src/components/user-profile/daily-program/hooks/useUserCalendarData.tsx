
import { useState, useEffect } from 'react';
import { useActivePrograms } from "@/hooks/useActivePrograms";
import { useWorkoutCompletionsCache } from "@/hooks/useWorkoutCompletionsCache";
import { format } from "date-fns";
import type { EnrichedAssignment } from "@/hooks/useActivePrograms/types";

interface UseUserCalendarDataProps {
  userId: string;
}

export const useUserCalendarData = ({ userId }: UseUserCalendarDataProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [realtimeKey, setRealtimeKey] = useState(0);
  const [workoutCompletions, setWorkoutCompletions] = useState<any[]>([]);

  // Fetch all active programs and filter for this user
  const { data: allActivePrograms = [], isLoading, error, refetch } = useActivePrograms();
  const { getAllWorkoutCompletions } = useWorkoutCompletionsCache();

  // Filter programs for the specific user
  const userPrograms = allActivePrograms.filter(program => program.user_id === userId);

  // Get workout completions for user programs
  useEffect(() => {
    const loadCompletions = async () => {
      if (userPrograms.length > 0) {
        const allCompletions = await getAllWorkoutCompletions();
        // Filter completions for this user's assignments
        const userAssignmentIds = userPrograms.map(p => p.id);
        const userCompletions = allCompletions.filter(c => userAssignmentIds.includes(c.assignment_id));
        setWorkoutCompletions(userCompletions);
      }
    };
    loadCompletions();
  }, [userPrograms, getAllWorkoutCompletions]);

  const programsForSelectedDate = selectedDate 
    ? userPrograms.filter(assignment => {
        const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
        return assignment.training_dates?.includes(selectedDateStr);
      })
    : [];

  const getWorkoutStatusForDate = (assignmentId: string, dateStr: string) => {
    const completion = workoutCompletions.find(c => 
      c.assignment_id === assignmentId && c.scheduled_date === dateStr
    );
    return completion?.status || 'scheduled';
  };

  const handleRefresh = () => {
    refetch();
    setRealtimeKey(prev => prev + 1);
  };

  const handleDelete = async (assignmentId: string) => {
    // This would typically not be allowed for regular users
    console.log('Delete not allowed for user profiles');
  };

  return {
    currentMonth,
    setCurrentMonth,
    selectedDate,
    setSelectedDate,
    realtimeKey,
    userPrograms,
    workoutCompletions,
    programsForSelectedDate,
    getWorkoutStatusForDate,
    handleRefresh,
    handleDelete,
    isLoading,
    error,
    refetch
  };
};
