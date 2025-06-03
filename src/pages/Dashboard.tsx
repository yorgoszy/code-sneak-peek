import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Heart } from "lucide-react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { useActivePrograms } from "@/hooks/useActivePrograms";
import { useWorkoutCompletions } from "@/hooks/useWorkoutCompletions";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { useRealtimePrograms } from "@/hooks/useRealtimePrograms";

const Dashboard = () => {
  const { user, loading, signOut, isAuthenticated } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [stats, setStats] = useState({
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
  
  const { getWorkoutCompletions } = useWorkoutCompletions();

  // Setup realtime subscriptions for automatic updates
  useRealtimePrograms({
    onProgramsChange: () => {
      console.log('🔄 Refreshing programs due to realtime change...');
      refetch();
      activeProgramsRefetch();
    },
    onAssignmentsChange: () => {
      console.log('🔄 Refreshing assignments due to realtime change...');
      refetch();
      activeProgramsRefetch();
      // Also refresh workout completions
      getWorkoutCompletions().then(setAllCompletions);
    }
  });

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

    fetchAllCompletions();
  }, [todaysPrograms, getWorkoutCompletions]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Heart className="h-12 w-12 text-pink-500 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Φόρτωση...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  const isAdmin = userProfile?.role === 'admin' || user?.email === 'yorgoszy@gmail.com' || user?.email === 'info@hyperkids.gr';

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Navigation */}
        <DashboardHeader
          isAdmin={isAdmin}
          userProfile={userProfile}
          userEmail={user?.email}
          onSignOut={handleSignOut}
        />

        {/* Dashboard Content */}
        <div className="flex-1 p-6">
          {/* Tabs */}
          <DashboardTabs />

          {/* Statistics Cards */}
          <DashboardStats stats={stats} />

          {/* Lower Section */}
          <DashboardContent
            isAdmin={isAdmin}
            todaysPrograms={todaysPrograms}
            activePrograms={activePrograms}
            allCompletions={allCompletions}
            onRefresh={refetch}
            onActiveProgramsRefresh={activeProgramsRefetch}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
