
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

const Dashboard = () => {
  const { user, loading, signOut, isAuthenticated } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

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
    }
  }, [user]);

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
              <h1 className="text-2xl font-bold text-gray-900">dashboard.home</h1>
              <p className="text-sm text-gray-600">
                Welcome back, {isAdmin ? 'Admin User!' : userProfile?.name || user?.email}
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
              Overview
            </button>
            <button className="text-sm font-medium text-gray-500 pb-2">
              Analytics
            </button>
            <button className="text-sm font-medium text-gray-500 pb-2">
              Reports
            </button>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Athletes"
              value="1"
              subtitle="Εγγεγραμμένοι αθλητές"
              icon={<Users className="h-5 w-5" />}
              trend="up"
            />
            <StatCard
              title="Active Programs"
              value="2"
              subtitle="Ενεργά προγράμματα"
              icon={<Activity className="h-5 w-5" />}
              trend="up"
            />
            <StatCard
              title="Available Exercises"
              value="3"
              subtitle="Διαθέσιμες ασκήσεις"
              icon={<Dumbbell className="h-5 w-5" />}
              trend="neutral"
            />
            <StatCard
              title="System Health"
              value="73%"
              subtitle="Λειτουργικότητα συστήματος"
              icon={<TrendingUp className="h-5 w-5" />}
              trend="up"
            />
          </div>

          {/* Lower Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <RecentActivity />
            </div>
            <div>
              <QuickActions />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
