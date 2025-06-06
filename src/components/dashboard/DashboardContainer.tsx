
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Heart } from "lucide-react";
import { Navigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { MobileNavigation } from "@/components/navigation/MobileNavigation";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { useDashboard } from "@/hooks/useDashboard";
import { useRoleCheck } from "@/hooks/useRoleCheck";

export const DashboardContainer = () => {
  const { user, loading, signOut, isAuthenticated } = useAuth();
  const { isAdmin, loading: rolesLoading } = useRoleCheck();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const {
    userProfile,
    stats
  } = useDashboard();

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

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        {/* Top Navigation */}
        <DashboardHeader
          userProfile={userProfile}
          userEmail={user?.email}
          onSignOut={handleSignOut}
        />

        {/* Dashboard Content */}
        <div className="flex-1 p-2 md:p-4 lg:p-6 overflow-hidden">
          {/* Tabs - hidden on mobile */}
          <div className="mb-2 md:mb-4 hidden md:block">
            <DashboardTabs />
          </div>

          {/* Statistics Cards */}
          <div className="mb-2 md:mb-4">
            <DashboardStats stats={stats} />
          </div>

          {/* Lower Section */}
          <div className="h-full">
            <DashboardContent
              isAdmin={isAdmin()}
              userProfile={userProfile}
            />
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <MobileNavigation />
    </div>
  );
};
