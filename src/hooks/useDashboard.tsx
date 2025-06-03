
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useActivePrograms } from "@/hooks/useActivePrograms";
import { useWorkoutCompletions } from "@/hooks/useWorkoutCompletions";
import { useRealtimePrograms } from "@/hooks/useRealtimePrograms";

interface DashboardStats {
  totalUsers: number;
  athletes: number;
  trainers: number;
  parents: number;
  general: number;
  activePrograms: number;
  totalExercises: number;
  newUsersThisMonth: number;
}

export const useDashboard = () => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    athletes: 0,
    trainers: 0,
    parents: 0,
    general: 0,
    activePrograms: 0,
    totalExercises: 0,
    newUsersThisMonth: 0
  });
  const [allCompletions, setAllCompletions] = useState<any[]>([]);

  // Get today's programs for admin (include completed for calendar view)
  const { programs: todaysPrograms, refetch } = useActivePrograms(true);
  
  // Get active programs for list (exclude completed)
  const { programs: activePrograms, refetch: activeProgramsRefetch } = useActivePrograms(false);
  
  // Get completed programs (include only completed)
  const { programs: allPrograms, refetch: allProgramsRefetch } = useActivePrograms(true);
  const completedPrograms = allPrograms.filter(program => program.progress === 100);
  
  const { getWorkoutCompletions } = useWorkoutCompletions();

  // Setup realtime subscriptions for automatic updates
  useRealtimePrograms({
    onProgramsChange: () => {
      console.log('🔄 Refreshing programs due to realtime change...');
      refetch();
      activeProgramsRefetch();
      allProgramsRefetch();
    },
    onAssignmentsChange: () => {
      console.log('🔄 Refreshing assignments due to realtime change...');
      refetch();
      activeProgramsRefetch();
      allProgramsRefetch();
      // Refresh workout completions for all today's programs
      fetchAllCompletions();
    }
  });

  const fetchAllCompletions = async () => {
    if (todaysPrograms.length === 0) {
      console.log('⚠️ No programs available, skipping completions fetch');
      setAllCompletions([]);
      return;
    }

    console.log('🔄 Fetching completions for programs:', todaysPrograms.length);
    const completionsData: any[] = [];
    
    for (const program of todaysPrograms) {
      try {
        console.log('🔍 Fetching completions for program:', program.id);
        const completions = await getWorkoutCompletions(program.id);
        console.log('✅ Completions received:', completions);
        completionsData.push(...completions.map(c => ({ ...c, assignment_id: program.id })));
      } catch (error) {
        console.error('❌ Error fetching completions for program:', program.id, error);
      }
    }
    
    console.log('📊 All completions data:', completionsData);
    setAllCompletions(completionsData);
  };

  const fetchDashboardStats = async () => {
    try {
      // Get total users count
      const { count: totalUsers } = await supabase
        .from('app_users')
        .select('*', { count: 'exact', head: true });

      // Get users by role
      const { data: usersByRole } = await supabase
        .from('app_users')
        .select('role');

      const athletes = usersByRole?.filter(u => u.role === 'athlete').length || 0;
      const trainers = usersByRole?.filter(u => u.role === 'trainer').length || 0;
      const parents = usersByRole?.filter(u => u.role === 'parent').length || 0;
      const general = usersByRole?.filter(u => u.role === 'general').length || 0;

      // Get active programs count
      const { count: activePrograms } = await supabase
        .from('programs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Get total exercises count
      const { count: totalExercises } = await supabase
        .from('exercises')
        .select('*', { count: 'exact', head: true });

      // Get new users this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: newUsersThisMonth } = await supabase
        .from('app_users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString());

      setStats({
        totalUsers: totalUsers || 0,
        athletes,
        trainers,
        parents,
        general,
        activePrograms: activePrograms || 0,
        totalExercises: totalExercises || 0,
        newUsersThisMonth: newUsersThisMonth || 0
      });

    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const handleRefreshAll = () => {
    refetch();
    activeProgramsRefetch();
    allProgramsRefetch();
  };

  useEffect(() => {
    if (user) {
      // Fetch user profile from app_users table
      const fetchUserProfile = async () => {
        const { data } = await supabase
          .from('app_users')
          .select('*')
          .eq('auth_user_id', user.id)
          .single();
        
        setUserProfile(data);
      };
      
      fetchUserProfile();
      fetchDashboardStats();
    }
  }, [user]);

  // Fetch completions for today's programs
  useEffect(() => {
    fetchAllCompletions();
  }, [todaysPrograms, getWorkoutCompletions]);

  return {
    userProfile,
    stats,
    todaysPrograms,
    activePrograms,
    completedPrograms,
    allCompletions,
    refetch,
    handleRefreshAll
  };
};
