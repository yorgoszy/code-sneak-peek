
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

      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

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

      // Υπολογισμός ενεργών χρηστών από τα workout completions
      const uniqueActiveUsers = new Set(recentActiveUsers?.map(item => item.user_id) || []);

      // Φιλτράρισμα ενεργών προγραμμάτων με την ίδια λογική που χρησιμοποιεί το useActivePrograms
      const activePrograms = (allAssignments || []).filter(assignment => {
        // Έλεγχος αν έχει πρόγραμμα
        if (!assignment.programs) {
          return false;
        }
        
        // Αν δεν έχει ημερομηνίες, το συμπεριλαμβάνουμε
        if (!assignment.start_date || !assignment.end_date) {
          return true;
        }
        
        const startDate = new Date(assignment.start_date);
        const endDate = new Date(assignment.end_date);
        
        // Πρόγραμμα είναι ενεργό αν:
        // 1. Έχει αρχίσει και δεν έχει τελειώσει (ενεργό)
        // 2. Αρχίζει μέσα στην επόμενη εβδομάδα (έρχεται σύντομα)
        const isActive = startDate <= today && endDate >= today;
        const isComingSoon = startDate > today && startDate <= nextWeek;
        
        return isActive || isComingSoon;
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
