import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface LiveWorkoutData {
  assignment_id: string;
  scheduled_date: string;
  status: string;
  start_time: string | null;
  checked_exercises: string[];
}

/**
 * Hook for admin/coach to see live workout state across all users.
 * Subscribes to workout_completions realtime changes and polls for in_progress workouts.
 */
export const useLiveWorkoutData = (assignmentIds: string[]) => {
  const [liveWorkouts, setLiveWorkouts] = useState<LiveWorkoutData[]>([]);
  const assignmentIdsRef = useRef(assignmentIds);
  assignmentIdsRef.current = assignmentIds;

  const fetchLiveWorkouts = useCallback(async () => {
    if (assignmentIdsRef.current.length === 0) {
      setLiveWorkouts([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('workout_completions')
        .select('assignment_id, scheduled_date, status, start_time, checked_exercises')
        .in('assignment_id', assignmentIdsRef.current)
        .eq('status', 'in_progress');

      if (!error && data) {
        setLiveWorkouts(data.map(d => ({
          assignment_id: d.assignment_id,
          scheduled_date: d.scheduled_date,
          status: d.status,
          start_time: d.start_time,
          checked_exercises: (d.checked_exercises as string[]) || []
        })));
      }
    } catch (error) {
      console.error('❌ useLiveWorkoutData fetch error:', error);
    }
  }, []);

  // Initial fetch + re-fetch when IDs change
  useEffect(() => {
    fetchLiveWorkouts();
  }, [assignmentIds.join(',')]);

  // Realtime subscription for workout_completions changes
  useEffect(() => {
    const channel = supabase
      .channel('live-workout-data')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workout_completions'
        },
        (payload) => {
          console.log('🔴 LIVE: workout_completions change detected', payload.eventType);
          // Re-fetch on any change
          fetchLiveWorkouts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLiveWorkouts]);

  /**
   * Check if a specific assignment has a live (in_progress) workout for a given date.
   */
  const getLiveWorkout = useCallback((assignmentId: string, dateStr: string): LiveWorkoutData | undefined => {
    return liveWorkouts.find(
      w => w.assignment_id === assignmentId && w.scheduled_date === dateStr
    );
  }, [liveWorkouts]);

  /**
   * Get elapsed seconds from start_time for a live workout.
   */
  const getElapsedSeconds = useCallback((startTime: string | null): number => {
    if (!startTime) return 0;
    return Math.floor((Date.now() - new Date(startTime).getTime()) / 1000);
  }, []);

  return {
    liveWorkouts,
    getLiveWorkout,
    getElapsedSeconds,
    refetch: fetchLiveWorkouts
  };
};
