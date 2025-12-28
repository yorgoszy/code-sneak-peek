
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { CoachSidebar } from "@/components/CoachSidebar";
import { Button } from "@/components/ui/button";
import { LogOut, Menu } from "lucide-react";
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
  const [isTablet, setIsTablet] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const {
    userProfile: dashboardUserProfile,
    stats
  } = useDashboard();

  // Check for tablet size
  useEffect(() => {
    const checkTabletSize = () => {
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };
    
    checkTabletSize();
    window.addEventListener('resize', checkTabletSize);
    
    return () => window.removeEventListener('resize', checkTabletSize);
  }, []);

  // Close mobile sidebar when route changes or screen size changes
  useEffect(() => {
    if (isMobile) {
      setShowMobileSidebar(false);
    }
  }, [isMobile]);

  // Check if user is coach
  const isCoach = userProfile?.role === 'coach';

  // Redirect non-admin and non-coach users to their personal profile
  useEffect(() => {
    console.log('🚦 DashboardContainer: Checking redirect conditions:', {
      authLoading,
      rolesLoading, 
      isAuthenticated,
      userProfileId: userProfile?.id,
      userRole: userProfile?.role,
      isAdminResult: isAdmin(),
      isCoach,
      hasCheckedRedirect
    });

    // Only proceed if all loading is complete and user is authenticated
    if (!authLoading && !rolesLoading && isAuthenticated && !hasCheckedRedirect) {
      console.log('🔍 DashboardContainer: Ready to check admin/coach status');
      
      if (userProfile?.id) {
        const adminStatus = isAdmin();
        console.log('🎭 DashboardContainer: Role check result - Admin:', adminStatus, 'Coach:', isCoach);
        
        // Allow both admin and coach to access dashboard
        if (!adminStatus && !isCoach) {
          console.log('🔄 DashboardContainer: Redirecting non-admin/non-coach user to profile:', userProfile.id);
          navigate(`/dashboard/user-profile/${userProfile.id}`);
        } else {
          console.log('👑 DashboardContainer: Admin/Coach user confirmed, staying on dashboard');
        }
        setHasCheckedRedirect(true);
      } else if (userProfile === null) {
        // If userProfile is explicitly null (not undefined), we've checked and found no profile
        console.log('⚠️ DashboardContainer: No user profile found');
        setHasCheckedRedirect(true);
      }
    }
  }, [authLoading, rolesLoading, isAuthenticated, userProfile, isAdmin, isCoach, navigate, hasCheckedRedirect]);

  // Show loading while any authentication process is happening
  if (authLoading || rolesLoading) {
    console.log('⏳ DashboardContainer: Loading state:', { authLoading, rolesLoading });
    return <CustomLoadingScreen />;
  }

  if (!isAuthenticated) {
    console.log('🚫 DashboardContainer: Not authenticated, redirecting to auth');
    return <Navigate to="/auth" replace />;
  }

  // If we're still checking for redirect or if user is not admin/coach and we have userProfile, don't render yet
  if (!hasCheckedRedirect || (!isAdmin() && !isCoach && userProfile?.id)) {
    console.log('🔄 DashboardContainer: Waiting for redirect check or redirecting...');
    return <CustomLoadingScreen />;
  }

  const handleSignOut = async () => {
    await signOut();
  };

  console.log('✅ DashboardContainer: Rendering dashboard for', isCoach ? 'coach' : 'admin', 'user');

  // Choose the appropriate sidebar based on role
  const SidebarComponent = isCoach ? CoachSidebar : Sidebar;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar - Large screens only */}
        <div className="hidden lg:block">
          <SidebarComponent
            isCollapsed={isCollapsed}
            setIsCollapsed={setIsCollapsed}
          />
        </div>
        
        {/* Mobile/Tablet Sidebar Overlay */}
        {showMobileSidebar && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div 
              className="absolute inset-0 bg-black bg-opacity-50"
              onClick={() => setShowMobileSidebar(false)}
            />
            <div className="absolute left-0 top-0 h-full bg-white shadow-xl">
              <SidebarComponent
                isCollapsed={false}
                setIsCollapsed={() => {}}
              />
            </div>
          </div>
        )}
        
        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          {/* Mobile/Tablet header with menu button */}
          {(isMobile || isTablet) && (
            <nav className="sticky top-0 z-40 bg-white border-b border-gray-200 px-3 py-4 shadow-sm lg:hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="rounded-none"
                    onClick={() => setShowMobileSidebar(true)}
                  >
                    <Menu className="h-4 w-4" />
                  </Button>
                  <h1 className="ml-4 text-lg font-semibold text-gray-900">Dashboard</h1>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="rounded-none"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </nav>
          )}
          
          {/* Dashboard Content */}
          <div className="flex-1 p-3 md:p-6">
            {/* Header with user info - Hidden on mobile/tablet when nav is shown */}
            {!(isMobile || isTablet) && (
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
                  <p className="text-gray-600 text-sm lg:text-base">
                    Καλώς ήρθατε, {isAdmin() ? 'Admin!' : isCoach ? 'Coach!' : dashboardUserProfile?.name || user?.email}
                  </p>
                </div>
                
                <div className="flex items-center space-x-2 lg:space-x-4">
                  <span className="text-xs lg:text-sm text-gray-600 hidden md:block">
                    {dashboardUserProfile?.name || user?.email}
                    {isAdmin() && <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded">Admin</span>}
                    {isCoach && <span className="ml-2 px-2 py-1 bg-[#00ffba]/20 text-[#00ffba] text-xs rounded">Coach</span>}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="rounded-none"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Αποσύνδεση</span>
                  </Button>
                </div>
              </div>
            )}

            {/* Mobile/Tablet compact header info */}
            {(isMobile || isTablet) && (
              <div className="mb-4 px-2">
                <p className="text-sm text-gray-600">
                  Καλώς ήρθατε, {isAdmin() ? 'Admin' : isCoach ? 'Coach' : dashboardUserProfile?.name || 'User'}
                  {isAdmin() && <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded">Admin</span>}
                  {isCoach && <span className="ml-2 px-2 py-1 bg-[#00ffba]/20 text-[#00ffba] text-xs rounded">Coach</span>}
                </p>
              </div>
            )}

            {/* Tabs */}
            <div className="mb-4 lg:mb-6">
              <DashboardTabs />
            </div>

            {/* Statistics Cards */}
            <div className="mb-4 lg:mb-6">
              <DashboardStats stats={stats} />
            </div>

            {/* Lower Section */}
            <DashboardContent
              isAdmin={isAdmin()}
              userProfile={dashboardUserProfile}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
