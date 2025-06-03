
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  activePrograms: number;
}

export const useDashboard = () => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
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

      // Παράλληλα queries για ταχύτητα
      const [
        { count: totalUsers },
        { count: newUsersThisMonth },
        { count: activePrograms },
        { data: recentActiveUsers }
      ] = await Promise.all([
        supabase.from('app_users').select('*', { count: 'exact', head: true }),
        supabase.from('app_users').select('*', { count: 'exact', head: true }).gte('created_at', startOfMonth.toISOString()),
        supabase.from('program_assignments').select('*', { count: 'exact', head: true }).gte('end_date', new Date().toISOString()),
        supabase.from('workout_completions').select('user_id').gte('created_at', thirtyDaysAgo.toISOString())
      ]);

      // Υπολογισμός ενεργών χρηστών από τα workout completions
      const uniqueActiveUsers = new Set(recentActiveUsers?.map(item => item.user_id) || []);

      setStats({
        totalUsers: totalUsers || 0,
        activeUsers: uniqueActiveUsers.size,
        newUsersThisMonth: newUsersThisMonth || 0,
        activePrograms: activePrograms || 0
      });

    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  useEffect(() => {
    if (user) {
      // Fetch user profile
      const fetchUserProfile = async () => {
        const { data } = await supabase
          .from('app_users')
          .select('id, name, email, role')
          .eq('auth_user_id', user.id)
          .single();
        
        setUserProfile(data);
      };
      
      fetchUserProfile();
      fetchDashboardStats();
    }
  }, [user]);

  return {
    userProfile,
    stats
  };
};
