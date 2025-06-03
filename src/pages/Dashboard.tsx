import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Heart, LogOut, Users, Activity, Dumbbell, TrendingUp } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { StatCard } from "@/components/StatCard";
import { RecentActivity } from "@/components/RecentActivity";
import { QuickActions } from "@/components/QuickActions";
import { format } from "date-fns";
import { useActivePrograms } from "@/hooks/useActivePrograms";
import { CalendarDay } from "@/components/active-programs/calendar/CalendarDay";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWorkoutCompletions } from "@/hooks/useWorkoutCompletions";

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

  // Get today's programs for admin
  const { programs: todaysPrograms, refetch } = useActivePrograms(true);
  const { getWorkoutCompletions } = useWorkoutCompletions();

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
        <nav className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-600">
                Καλώς ήρθατε, {isAdmin ? 'Admin User!' : userProfile?.name || user?.email}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {userProfile?.name || user?.email}
                {isAdmin && <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded">Admin</span>}
              </span>
              <Button 
                variant="outline" 
                className="rounded-none"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Αποσύνδεση
              </Button>
            </div>
          </div>
        </nav>

        {/* Dashboard Content */}
        <div className="flex-1 p-6">
          {/* Tabs */}
          <div className="flex space-x-6 mb-6">
            <button className="text-sm font-medium text-blue-600 border-b-2 border-blue-600 pb-2">
              Επισκόπηση
            </button>
            <button className="text-sm font-medium text-gray-500 pb-2">
              Αναλυτικά
            </button>
            <button className="text-sm font-medium text-gray-500 pb-2">
              Αναφορές
            </button>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Σύνολο Χρηστών"
              value={stats.totalUsers}
              subtitle={`Αθλητές: ${stats.athletes} | Προπονητές: ${stats.trainers} | Γονείς: ${stats.parents} | Γενικοί: ${stats.general}`}
              icon={<Users className="h-5 w-5" />}
              trend="up"
            />
            <StatCard
              title="Νέοι Χρήστες"
              value={stats.newUsersThisMonth}
              subtitle="Αυτόν τον μήνα"
              icon={<TrendingUp className="h-5 w-5" />}
              trend={stats.newUsersThisMonth > 0 ? "up" : "neutral"}
            />
            <StatCard
              title="Ενεργά Προγράμματα"
              value={stats.activePrograms}
              subtitle="Προγράμματα προπόνησης"
              icon={<Activity className="h-5 w-5" />}
              trend={stats.activePrograms > 0 ? "up" : "neutral"}
            />
            <StatCard
              title="Διαθέσιμες Ασκήσεις"
              value={stats.totalExercises}
              subtitle="Στη βάση δεδομένων"
              icon={<Dumbbell className="h-5 w-5" />}
              trend="neutral"
            />
          </div>

          {/* Lower Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <RecentActivity />
            </div>
            <div className="space-y-6">
              <QuickActions />
              
              {/* Today's Programs Section for Admin - using CalendarDay component */}
              {isAdmin && (
                <Card className="rounded-none">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Activity className="h-5 w-5 mr-2" />
                      Σημερινά Προγράμματα ({format(new Date(), 'dd/MM/yyyy')})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CalendarDay
                      day={new Date()}
                      currentDate={new Date()}
                      programs={todaysPrograms}
                      allCompletions={allCompletions}
                      onRefresh={refetch}
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
