
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Heart } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { useDashboard } from "@/hooks/useDashboard";
import { useRoleCheck } from "@/hooks/useRoleCheck";

export const DashboardContainer = () => {
  const { user, loading, signOut, isAuthenticated } = useAuth();
  const { isAdmin, userProfile, loading: rolesLoading } = useRoleCheck();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  
  const {
    userProfile: dashboardUserProfile,
    stats
  } = useDashboard();

  // Redirect non-admin users to their personal profile
  useEffect(() => {
    console.log('🚦 DashboardContainer useEffect:', {
      loading,
      rolesLoading, 
      isAuthenticated,
      userProfile: userProfile?.id,
      isAdminResult: isAdmin()
    });

    if (!loading && !rolesLoading && isAuthenticated && userProfile) {
      if (!isAdmin()) {
        console.log('🔄 Redirecting non-admin user to profile:', userProfile.id);
        navigate(`/dashboard/user-profile/${userProfile.id}`);
      } else {
        console.log('👑 Admin user, staying on dashboard');
      }
    }
  }, [loading, rolesLoading, isAuthenticated, userProfile, isAdmin, navigate]);

  if (loading || rolesLoading) {
    console.log('⏳ Loading state:', { loading, rolesLoading });
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
    console.log('🚫 Not authenticated, redirecting to auth');
    return <Navigate to="/auth" replace />;
  }

  // Show dashboard for admin users, redirect will happen in useEffect for non-admin
  if (!isAdmin() && userProfile) {
    console.log('🔄 Non-admin detected, should redirect...');
    return null; // Let useEffect handle the redirect
  }

  const handleSignOut = async () => {
    await signOut();
  };

  console.log('✅ Rendering dashboard for admin user');

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Navigation */}
        <DashboardHeader
          userProfile={dashboardUserProfile}
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
            isAdmin={isAdmin()}
            userProfile={dashboardUserProfile}
          />
        </div>
      </div>
    </div>
  );
};
