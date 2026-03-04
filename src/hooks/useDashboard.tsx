
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { supabase } from "@/integrations/supabase/client";
import { formatDateToLocalString } from "@/utils/dateUtils";

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  activePrograms: number;
}

export const useDashboard = () => {
  const { user } = useAuth();
  const { userProfile } = useRoleCheck();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    newUsersThisMonth: 0,
    activePrograms: 0
  });

  const fetchDashboardStats = async () => {
    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const today = new Date();
      const todayString = formatDateToLocalString(today);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      console.log('📊 Dashboard fetching stats for date:', todayString);

      // Παράλληλα queries για ταχύτητα
      const [
        { count: totalUsers },
        { count: newUsersThisMonth },
        { data: recentActiveUsers },
        { data: allAssignments }
      ] = await Promise.all([
        supabase.from('app_users').select('*', { count: 'exact', head: true }),
        supabase.from('app_users').select('*', { count: 'exact', head: true }).gte('created_at', startOfMonth.toISOString()),
        supabase.from('workout_completions').select('user_id').gte('created_at', thirtyDaysAgo.toISOString()),
        supabase.from('program_assignments').select(`
          *,
          programs:program_id(*)
        `)
      ]);

      // Υπολογισμός ενεργών χρηστών βάσει ενεργών συνδρομών
      const { data: activeSubscriptionUsers } = await supabase
        .from('user_subscriptions')
        .select('user_id')
        .eq('status', 'active')
        .eq('is_paused', false)
        .gte('end_date', todayString);
      
      const uniqueActiveUsers = new Set(activeSubscriptionUsers?.map(item => item.user_id) || []);

      // Φιλτράρισμα ενεργών προγραμμάτων με την ίδια λογική που χρησιμοποιεί το useActivePrograms
      const activePrograms = (allAssignments || []).filter(assignment => {
        // Έλεγχος αν έχει πρόγραμμα
        if (!assignment.programs) {
          return false;
        }
        
        // Χρησιμοποιούμε το training_dates array αντί για start_date/end_date
        if (!assignment.training_dates || assignment.training_dates.length === 0) {
          return true; // Αν δεν έχει ημερομηνίες, το συμπεριλαμβάνουμε
        }
        
        // Βρίσκουμε την πρώτη και τελευταία ημερομηνία από το training_dates array
        const trainingDates = assignment.training_dates.map((date: string) => new Date(date)).sort((a: Date, b: Date) => a.getTime() - b.getTime());
        const firstTrainingDate = trainingDates[0];
        const lastTrainingDate = trainingDates[trainingDates.length - 1];
        
        // Πρόγραμμα είναι ενεργό αν:
        // 1. Έχει αρχίσει και δεν έχει τελειώσει (ενεργό)
        // 2. Αρχίζει μέσα στην επόμενη εβδομάδα (έρχεται σύντομα)
        const isActive = firstTrainingDate <= today && lastTrainingDate >= today;
        const isComingSoon = firstTrainingDate > today && firstTrainingDate <= nextWeek;
        
        return isActive || isComingSoon;
      });

      console.log('📊 Dashboard stats calculated:', {
        totalUsers: totalUsers || 0,
        activeUsers: uniqueActiveUsers.size,
        newUsersThisMonth: newUsersThisMonth || 0,
        activePrograms: activePrograms.length
      });

      setStats({
        totalUsers: totalUsers || 0,
        activeUsers: uniqueActiveUsers.size,
        newUsersThisMonth: newUsersThisMonth || 0,
        activePrograms: activePrograms.length
      });

    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchDashboardStats();
  }, [user]);

  return {
    userProfile,
    stats
  };
};
