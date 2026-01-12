import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface UserGoalWithUser {
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

export const useAllActiveGoals = () => {
  const [goals, setGoals] = useState<UserGoalWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGoals = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Fetch all active goals with user info
      const { data, error } = await supabase
        .from('user_goals')
        .select(`
          *,
          app_users!user_goals_user_id_fkey (
            id,
            name,
            email,
            avatar_url
          )
        `)
        .eq('status', 'in_progress')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const goalsWithUsers: UserGoalWithUser[] = (data || []).map((goal: any) => ({
        ...goal,
        user_name: goal.app_users?.name || 'Άγνωστος',
        user_email: goal.app_users?.email || '',
        user_avatar: goal.app_users?.avatar_url || null,
      }));
      
      setGoals(goalsWithUsers);
    } catch (error) {
      console.error('Error fetching goals:', error);
      toast.error('Σφάλμα κατά τη φόρτωση στόχων');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const updateGoal = async (goalId: string, updates: Partial<UserGoalWithUser>) => {
    try {
      const { data, error } = await supabase
        .from('user_goals')
        .update(updates)
        .eq('id', goalId)
        .select()
        .single();

      if (error) throw error;
      
      // Refetch to get updated user info
      await fetchGoals();
      toast.success('Ο στόχος ενημερώθηκε');
      return data;
    } catch (error) {
      console.error('Error updating goal:', error);
      toast.error('Σφάλμα κατά την ενημέρωση στόχου');
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
      setGoals(prev => prev.filter(g => g.id !== goalId));
      toast.success('Ο στόχος διαγράφηκε');
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast.error('Σφάλμα κατά τη διαγραφή στόχου');
      throw error;
    }
  };

  const completeGoal = async (goalId: string) => {
    try {
      const goal = goals.find(g => g.id === goalId);
      if (!goal) return;

      // Update goal status
      const { data: goalData, error: goalError } = await supabase
        .from('user_goals')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', goalId)
        .select()
        .single();

      if (goalError) throw goalError;

      // Create award
      const { error: awardError } = await supabase
        .from('user_awards')
        .insert({
          user_id: goalData.user_id,
          goal_id: goalId,
          award_type: 'goal_completed',
          title: `Επίτευξη: ${goalData.title}`,
          description: goalData.description,
          icon_name: 'Award',
          color: '#cb8954',
        });

      if (awardError) throw awardError;

      // Remove from active goals list
      setGoals(prev => prev.filter(g => g.id !== goalId));
      toast.success('🎉 Συγχαρητήρια! Ο στόχος ολοκληρώθηκε!');
    } catch (error) {
      console.error('Error completing goal:', error);
      toast.error('Σφάλμα κατά την ολοκλήρωση στόχου');
      throw error;
    }
  };

  const updateProgress = async (goalId: string, newValue: number) => {
    try {
      const goal = goals.find(g => g.id === goalId);
      if (!goal) return;

      // Check if goal is completed
      if (goal.target_value && newValue >= goal.target_value) {
        return completeGoal(goalId);
      }

      return updateGoal(goalId, { current_value: newValue });
    } catch (error) {
      console.error('Error updating progress:', error);
      throw error;
    }
  };

  const createGoal = async (goalData: any) => {
    try {
      const { data, error } = await supabase
        .from('user_goals')
        .insert({
          ...goalData,
          current_value: 0,
          status: 'in_progress',
        })
        .select()
        .single();

      if (error) throw error;
      
      // Refetch to get user info
      await fetchGoals();
      toast.success('Ο στόχος δημιουργήθηκε');
      return data;
    } catch (error) {
      console.error('Error creating goal:', error);
      toast.error('Σφάλμα κατά τη δημιουργία στόχου');
      throw error;
    }
  };

  return {
    goals,
    isLoading,
    refetch: fetchGoals,
    createGoal,
    updateGoal,
    deleteGoal,
    completeGoal,
    updateProgress,
  };
};
