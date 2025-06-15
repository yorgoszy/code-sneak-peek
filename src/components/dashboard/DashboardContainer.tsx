
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
    if (!loading && !rolesLoading && isAuthenticated && userProfile && !isAdmin()) {
      navigate(`/dashboard/user-profile/${userProfile.id}`);
    }
  }, [loading, rolesLoading, isAuthenticated, userProfile, isAdmin, navigate]);

  if (loading || rolesLoading) {
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

  // Only allow admin users to access the main dashboard
  if (!isAdmin()) {
    return <Navigate to={`/dashboard/user-profile/${userProfile?.id}`} replace />;
  }

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
