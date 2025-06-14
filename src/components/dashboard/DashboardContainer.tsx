
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Heart } from "lucide-react";
import { Navigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { useDashboard } from "@/hooks/useDashboard";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

export const DashboardContainer = () => {
  const { user, loading, signOut, isAuthenticated } = useAuth();
  const { isAdmin, loading: rolesLoading } = useRoleCheck();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const {
    userProfile,
    stats
  } = useDashboard();

  const isMobile = useIsMobile();

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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar (visible on desktop, toggleable on mobile) */}
      {!isMobile && (
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      )}
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Navigation */}
        <div className="flex items-center">
          {isMobile && (
            <SidebarTrigger className="mr-2 mt-2 mb-2" />
          )}
          <DashboardHeader
            userProfile={userProfile}
            userEmail={user?.email}
            onSignOut={handleSignOut}
          />
        </div>
        {/* Dashboard Content */}
        <div className="flex-1 p-2 sm:p-6">
          {/* Tabs */}
          <DashboardTabs />
          {/* Statistics Cards */}
          <DashboardStats stats={stats} />
          {/* Lower Section */}
          <DashboardContent
            isAdmin={isAdmin()}
            userProfile={userProfile}
          />
        </div>
      </div>
    </div>
  );
};
