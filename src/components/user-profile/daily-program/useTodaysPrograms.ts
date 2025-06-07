
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { formatDateToLocalString } from '@/utils/dateUtils';
import type { TodaysProgramAssignment } from './types';

export const useTodaysPrograms = (userId: string) => {
  const [todaysPrograms, setTodaysPrograms] = useState<TodaysProgramAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const today = new Date();
  const todayString = formatDateToLocalString(today);

  const fetchTodaysPrograms = async () => {
    try {
      setLoading(true);
      
      console.log('🔍 Fetching programs for date:', todayString);
      
      const { data: assignments, error } = await supabase
        .from('program_assignments')
        .select(`
          *,
          programs!program_assignments_program_id_fkey (
            id,
            name,
            description,
            program_weeks (
              id,
              name,
              week_number,
              program_days (
                id,
                name,
                day_number,
                estimated_duration_minutes,
                program_blocks (
                  id,
                  name,
                  block_order,
                  program_exercises (
                    id,
                    exercise_id,
                    sets,
                    reps,
                    kg,
                    percentage_1rm,
                    velocity_ms,
                    tempo,
                    rest,
                    notes,
                    exercise_order,
                    exercises (
                      id,
                      name,
                      description
                    )
                  )
                )
              )
            )
          ),
          app_users (
            id,
            name,
            email,
            photo_url
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .contains('training_dates', [todayString]);

      if (error) {
        console.error('Error fetching today programs:', error);
        return;
      }

      console.log('✅ Found assignments for today:', assignments?.length || 0);

      // Transform the data to match our expected type structure
      const transformedAssignments = (assignments || []).map(assignment => ({
        ...assignment,
        // Ensure app_users is a single object or null, not an array
        app_users: Array.isArray(assignment.app_users) 
          ? assignment.app_users[0] || null 
          : assignment.app_users
      }));

      setTodaysPrograms(transformedAssignments as TodaysProgramAssignment[]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchTodaysPrograms();
    }
  }, [userId, todayString]);

  return {
    todaysPrograms,
    loading,
    refetch: fetchTodaysPrograms
  };
};
