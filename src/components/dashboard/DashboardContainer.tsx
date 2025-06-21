
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { useDashboard } from "@/hooks/useDashboard";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { CustomLoadingScreen } from "@/components/ui/custom-loading";
import { useIsMobile } from "@/hooks/use-mobile";

export const DashboardContainer = () => {
  const { user, loading: authLoading, signOut, isAuthenticated } = useAuth();
  const { isAdmin, userProfile, loading: rolesLoading } = useRoleCheck();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hasCheckedRedirect, setHasCheckedRedirect] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const {
    userProfile: dashboardUserProfile,
    stats
  } = useDashboard();

  // Redirect non-admin users to their personal profile
  useEffect(() => {
    console.log('🚦 DashboardContainer: Checking redirect conditions:', {
      authLoading,
      rolesLoading, 
      isAuthenticated,
      userProfileId: userProfile?.id,
      isAdminResult: isAdmin(),
      hasCheckedRedirect
    });

    // Only proceed if all loading is complete and user is authenticated
    if (!authLoading && !rolesLoading && isAuthenticated && !hasCheckedRedirect) {
      console.log('🔍 DashboardContainer: Ready to check admin status');
      
      if (userProfile?.id) {
        const adminStatus = isAdmin();
        console.log('🎭 DashboardContainer: Admin check result:', adminStatus);
        
        if (!adminStatus) {
          console.log('🔄 DashboardContainer: Redirecting non-admin user to profile:', userProfile.id);
          navigate(`/dashboard/user-profile/${userProfile.id}`);
        } else {
          console.log('👑 DashboardContainer: Admin user confirmed, staying on dashboard');
        }
        setHasCheckedRedirect(true);
      } else if (userProfile === null) {
        // If userProfile is explicitly null (not undefined), we've checked and found no profile
        console.log('⚠️ DashboardContainer: No user profile found');
        setHasCheckedRedirect(true);
      }
    }
  }, [authLoading, rolesLoading, isAuthenticated, userProfile, isAdmin, navigate, hasCheckedRedirect]);

  // Show loading while any authentication process is happening
  if (authLoading || rolesLoading) {
    console.log('⏳ DashboardContainer: Loading state:', { authLoading, rolesLoading });
    return <CustomLoadingScreen />;
  }

  if (!isAuthenticated) {
    console.log('🚫 DashboardContainer: Not authenticated, redirecting to auth');
    return <Navigate to="/auth" replace />;
  }

  // If we're still checking for redirect or if user is not admin and we have userProfile, don't render yet
  if (!hasCheckedRedirect || (!isAdmin() && userProfile?.id)) {
    console.log('🔄 DashboardContainer: Waiting for redirect check or redirecting...');
    return <CustomLoadingScreen />;
  }

  const handleSignOut = async () => {
    await signOut();
  };

  console.log('✅ DashboardContainer: Rendering dashboard for admin user');

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - Hidden on mobile */}
      {!isMobile && (
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Navigation */}
        <DashboardHeader
          userProfile={dashboardUserProfile}
          userEmail={user?.email}
          onSignOut={handleSignOut}
        />

        {/* Dashboard Content */}
        <div className={`flex-1 ${isMobile ? 'p-3' : 'p-6'}`}>
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
