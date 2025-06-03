
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useActivePrograms } from "@/hooks/useActivePrograms";

interface DashboardStats {
  totalUsers: number;
  activePrograms: number;
  totalExercises: number;
  newUsersThisMonth: number;
}

export const useDashboard = () => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activePrograms: 0,
    totalExercises: 0,
    newUsersThisMonth: 0
  });

  // Μόνο active programs για admin
  const { programs: activePrograms, refetch: activeProgramsRefetch } = useActivePrograms(false);

  const fetchDashboardStats = async () => {
    try {
      // Παράλληλα queries για ταχύτητα
      const [
        { count: totalUsers },
        { count: activeProgramsCount },
        { count: totalExercises },
        { count: newUsersThisMonth }
      ] = await Promise.all([
        supabase.from('app_users').select('*', { count: 'exact', head: true }),
        supabase.from('programs').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('exercises').select('*', { count: 'exact', head: true }),
        supabase.from('app_users').select('*', { count: 'exact', head: true })
          .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
      ]);

      setStats({
        totalUsers: totalUsers || 0,
        activePrograms: activeProgramsCount || 0,
        totalExercises: totalExercises || 0,
        newUsersThisMonth: newUsersThisMonth || 0
      });

    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const handleRefreshAll = () => {
    activeProgramsRefetch();
    fetchDashboardStats();
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
    stats,
    activePrograms,
    handleRefreshAll
  };
};
