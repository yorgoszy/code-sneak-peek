
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

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

  const fetchDashboardStats = async () => {
    try {
      // Μόνο βασικά stats - παράλληλα για ταχύτητα
      const [
        { count: totalUsers },
        { count: totalExercises }
      ] = await Promise.all([
        supabase.from('app_users').select('*', { count: 'exact', head: true }),
        supabase.from('exercises').select('*', { count: 'exact', head: true })
      ]);

      setStats({
        totalUsers: totalUsers || 0,
        activePrograms: 0, // Θα φορτωθεί lazy
        totalExercises: totalExercises || 0,
        newUsersThisMonth: 0 // Θα φορτωθεί lazy
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
