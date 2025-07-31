
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
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
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [hasCheckedRedirect, setHasCheckedRedirect] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const {
    userProfile: dashboardUserProfile,
    stats
  } = useDashboard();

  // Close mobile sidebar when route changes or screen size changes
  useEffect(() => {
    if (isMobile) {
      setShowMobileSidebar(false);
    }
  }, [isMobile]);

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
    <div className="min-h-screen bg-gray-50 flex w-full">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobile && showMobileSidebar && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowMobileSidebar(false)}
          />
          <div className="relative w-64 h-full">
            <Sidebar 
              isCollapsed={false} 
              setIsCollapsed={setIsCollapsed}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Dashboard Content */}
        <div className="flex-1 p-3 md:p-6">
          {/* Header with user info */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
              <p className="text-gray-600">
                Καλώς ήρθατε, {isAdmin() ? 'Admin User!' : dashboardUserProfile?.name || user?.email}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {dashboardUserProfile?.name || user?.email}
                {isAdmin() && <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded">Admin</span>}
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
