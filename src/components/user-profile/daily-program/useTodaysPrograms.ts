
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import type { TodaysProgramAssignment } from './types';

export const useTodaysPrograms = (userId: string) => {
  const [todaysPrograms, setTodaysPrograms] = useState<TodaysProgramAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const today = new Date();
  const todayString = format(today, 'yyyy-MM-dd');

  const fetchTodaysPrograms = async () => {
    try {
      setLoading(true);
      
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
          app_users!program_assignments_user_id_fkey (
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

      setTodaysPrograms(assignments || []);
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
