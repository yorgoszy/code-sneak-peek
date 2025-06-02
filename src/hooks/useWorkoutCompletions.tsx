
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface WorkoutCompletion {
  id: string;
  assignment_id: string;
  user_id: string;
  program_id: string;
  week_number: number;
  day_number: number;
  scheduled_date: string;
  completed_date: string;
  status: 'completed' | 'missed' | 'makeup';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AssignmentAttendance {
  id: string;
  assignment_id: string;
  user_id: string;
  total_scheduled_workouts: number;
  completed_workouts: number;
  missed_workouts: number;
  makeup_workouts: number;
  attendance_percentage: number;
  last_updated: string;
}

export const useWorkoutCompletions = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const getUserId = async () => {
    if (!user?.id) return null;
    
    const { data: userData } = await supabase
      .from('app_users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();
    
    return userData?.id || null;
  };

  const completeWorkout = async (
    assignmentId: string,
    programId: string,
    weekNumber: number,
    dayNumber: number,
    scheduledDate: string,
    notes?: string
  ) => {
    try {
      setLoading(true);
      const userId = await getUserId();
      if (!userId) throw new Error('User not found');

      const { data, error } = await supabase
        .from('workout_completions')
        .insert({
          assignment_id: assignmentId,
          user_id: userId,
          program_id: programId,
          week_number: weekNumber,
          day_number: dayNumber,
          scheduled_date: scheduledDate,
          completed_date: new Date().toISOString().split('T')[0],
          status: 'completed',
          notes
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error completing workout:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getAssignmentAttendance = async (assignmentId: string) => {
    try {
      const { data, error } = await supabase
        .from('assignment_attendance')
        .select('*')
        .eq('assignment_id', assignmentId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error fetching attendance:', error);
      throw error;
    }
  };

  const getWorkoutCompletions = async (assignmentId: string) => {
    try {
      const { data, error } = await supabase
        .from('workout_completions')
        .select('*')
        .eq('assignment_id', assignmentId)
        .order('scheduled_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching workout completions:', error);
      throw error;
    }
  };

  return {
    loading,
    completeWorkout,
    getAssignmentAttendance,
    getWorkoutCompletions
  };
};
