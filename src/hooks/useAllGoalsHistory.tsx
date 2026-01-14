import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface GoalWithUser {
  id: string;
  user_id: string;
  goal_type: string;
  title: string;
  description: string | null;
  target_value: number | null;
  current_value: number | null;
  unit: string | null;
  start_date: string;
  target_date: string | null;
  status: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  // User info
  user_name: string;
  user_email: string;
  user_avatar: string | null;
}

export const useAllGoalsHistory = (coachId?: string) => {
  const [completedGoals, setCompletedGoals] = useState<GoalWithUser[]>([]);
  const [failedGoals, setFailedGoals] = useState<GoalWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGoalsHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Fetch completed goals
      let completedQuery = supabase
        .from('user_goals')
        .select(`
          *,
          app_users!user_goals_user_id_fkey (
            id,
            name,
            email,
            avatar_url,
            photo_url
          )
        `)
        .eq('status', 'completed');
      
      if (coachId) {
        completedQuery = completedQuery.eq('coach_id', coachId);
      }
      
      const { data: completedData, error: completedError } = await completedQuery.order('completed_at', { ascending: false });

      if (completedError) throw completedError;
      
      // Fetch failed goals (expired - target_date passed and not completed)
      const today = new Date().toISOString().split('T')[0];
      let failedQuery = supabase
        .from('user_goals')
        .select(`
          *,
          app_users!user_goals_user_id_fkey (
            id,
            name,
            email,
            avatar_url,
            photo_url
          )
        `)
        .eq('status', 'in_progress')
        .lt('target_date', today);
      
      if (coachId) {
        failedQuery = failedQuery.eq('coach_id', coachId);
      }
      
      const { data: failedData, error: failedError } = await failedQuery.order('target_date', { ascending: false });

      if (failedError) throw failedError;

      const mapGoals = (data: any[]): GoalWithUser[] => 
        (data || []).map((goal: any) => ({
          ...goal,
          user_name: goal.app_users?.name || 'Άγνωστος',
          user_email: goal.app_users?.email || '',
          user_avatar: goal.app_users?.photo_url || goal.app_users?.avatar_url || null,
        }));
      
      setCompletedGoals(mapGoals(completedData));
      setFailedGoals(mapGoals(failedData));
    } catch (error) {
      console.error('Error fetching goals history:', error);
      toast.error('Σφάλμα κατά τη φόρτωση ιστορικού στόχων');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoalsHistory();
  }, [fetchGoalsHistory, coachId]);

  const markAsFailed = async (goalId: string) => {
    try {
      const { error } = await supabase
        .from('user_goals')
        .update({ status: 'failed' })
        .eq('id', goalId);

      if (error) throw error;
      
      await fetchGoalsHistory();
      toast.success('Ο στόχος σημειώθηκε ως αποτυχημένος');
    } catch (error) {
      console.error('Error marking goal as failed:', error);
      toast.error('Σφάλμα');
      throw error;
    }
  };

  const deleteGoal = async (goalId: string) => {
    try {
      const { error } = await supabase
        .from('user_goals')
        .delete()
        .eq('id', goalId);

      if (error) throw error;
      
      setCompletedGoals(prev => prev.filter(g => g.id !== goalId));
      setFailedGoals(prev => prev.filter(g => g.id !== goalId));
      toast.success('Ο στόχος διαγράφηκε');
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast.error('Σφάλμα κατά τη διαγραφή');
      throw error;
    }
  };

  return {
    completedGoals,
    failedGoals,
    isLoading,
    refetch: fetchGoalsHistory,
    markAsFailed,
    deleteGoal,
  };
};
