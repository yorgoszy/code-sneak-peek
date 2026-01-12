import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface UserGoal {
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
}

export interface UserAward {
  id: string;
  user_id: string;
  goal_id: string | null;
  award_type: string;
  title: string;
  description: string | null;
  icon_name: string | null;
  color: string | null;
  awarded_at: string;
  is_displayed: boolean | null;
  created_at: string;
}

export const useUserGoals = (userId?: string) => {
  const [goals, setGoals] = useState<UserGoal[]>([]);
  const [awards, setAwards] = useState<UserAward[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGoals = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_goals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      console.error('Error fetching goals:', error);
      toast.error('Σφάλμα κατά τη φόρτωση στόχων');
    }
  }, [userId]);

  const fetchAwards = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_awards')
        .select('*')
        .eq('user_id', userId)
        .order('awarded_at', { ascending: false });

      if (error) throw error;
      setAwards(data || []);
    } catch (error) {
      console.error('Error fetching awards:', error);
      toast.error('Σφάλμα κατά τη φόρτωση βραβείων');
    }
  }, [userId]);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchGoals(), fetchAwards()]);
    setIsLoading(false);
  }, [fetchGoals, fetchAwards]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const createGoal = async (goal: Omit<UserGoal, 'id' | 'created_at' | 'updated_at' | 'current_value' | 'status' | 'completed_at'>) => {
    try {
      const { data, error } = await supabase
        .from('user_goals')
        .insert({
          ...goal,
          current_value: 0,
          status: 'in_progress',
        })
        .select()
        .single();

      if (error) throw error;
      setGoals(prev => [data, ...prev]);
      toast.success('Ο στόχος δημιουργήθηκε');
      return data;
    } catch (error) {
      console.error('Error creating goal:', error);
      toast.error('Σφάλμα κατά τη δημιουργία στόχου');
      throw error;
    }
  };

  const updateGoal = async (goalId: string, updates: Partial<UserGoal>) => {
    try {
      const { data, error } = await supabase
        .from('user_goals')
        .update(updates)
        .eq('id', goalId)
        .select()
        .single();

      if (error) throw error;
      setGoals(prev => prev.map(g => g.id === goalId ? data : g));
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
      const { data: awardData, error: awardError } = await supabase
        .from('user_awards')
        .insert({
          user_id: goalData.user_id,
          goal_id: goalId,
          award_type: 'goal_completed',
          title: `Επίτευξη: ${goalData.title}`,
          description: goalData.description,
          icon_name: 'Award',
          color: '#cb8954',
        })
        .select()
        .single();

      if (awardError) throw awardError;

      setGoals(prev => prev.map(g => g.id === goalId ? goalData : g));
      setAwards(prev => [awardData, ...prev]);
      toast.success('🎉 Συγχαρητήρια! Ο στόχος ολοκληρώθηκε!');
      return { goal: goalData, award: awardData };
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

      const updates: Partial<UserGoal> = { current_value: newValue };

      // Check if goal is completed
      if (goal.target_value && newValue >= goal.target_value) {
        return completeGoal(goalId);
      }

      return updateGoal(goalId, updates);
    } catch (error) {
      console.error('Error updating progress:', error);
      throw error;
    }
  };

  const deleteAward = async (awardId: string) => {
    try {
      const { error } = await supabase
        .from('user_awards')
        .delete()
        .eq('id', awardId);

      if (error) throw error;
      setAwards(prev => prev.filter(a => a.id !== awardId));
      toast.success('Το βραβείο διαγράφηκε');
    } catch (error) {
      console.error('Error deleting award:', error);
      toast.error('Σφάλμα κατά τη διαγραφή βραβείου');
      throw error;
    }
  };

  const toggleAwardDisplay = async (awardId: string, isDisplayed: boolean) => {
    try {
      const { data, error } = await supabase
        .from('user_awards')
        .update({ is_displayed: isDisplayed })
        .eq('id', awardId)
        .select()
        .single();

      if (error) throw error;
      setAwards(prev => prev.map(a => a.id === awardId ? data : a));
    } catch (error) {
      console.error('Error toggling award display:', error);
      toast.error('Σφάλμα κατά την ενημέρωση');
      throw error;
    }
  };

  return {
    goals,
    awards,
    isLoading,
    refetch: fetchAll,
    createGoal,
    updateGoal,
    deleteGoal,
    completeGoal,
    updateProgress,
    deleteAward,
    toggleAwardDisplay,
  };
};
