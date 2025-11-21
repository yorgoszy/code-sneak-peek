import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { CustomLoadingScreen } from "@/components/ui/custom-loading";
import { UserProfileSidebar } from "@/components/user-profile/UserProfileSidebar";
import { UserProfileContent } from "@/components/user-profile/UserProfileContent";
import { useUserProfileData } from "@/components/user-profile/hooks/useUserProfileData";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTranslation } from 'react-i18next';
import { supabase } from "@/integrations/supabase/client";

const DashboardWidget = () => {
  const { user, loading: authLoading, isAuthenticated, signOut } = useAuth();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("overview");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  
  // Fetch user profile data using the hook
  const { stats, programs, tests, payments, visits } = useUserProfileData(userProfile, !!userProfile);

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) return;
      
      try {
        setProfileLoading(true);
        const { data } = await supabase
          .from('app_users')
          .select('*')
          .eq('id', user.id)
          .single();
        
        setUserProfile(data);
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchUserProfile();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    
    // Set custom manifest for dashboard widget
    const existingManifest = document.querySelector('link[rel="manifest"]');
    if (existingManifest) {
      existingManifest.remove();
    }
    
    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = '/dashboard-manifest.json';
    document.head.appendChild(link);

    return () => {
      const manifestLink = document.querySelector('link[rel="manifest"][href="/dashboard-manifest.json"]');
      if (manifestLink) {
        manifestLink.remove();
      }
    };
  }, [user?.id]);

  if (authLoading || profileLoading) {
    return <CustomLoadingScreen />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/auth" replace />;
  }

  if (!userProfile) {
    return <CustomLoadingScreen />;
  }

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <UserProfileSidebar 
          isCollapsed={isCollapsed} 
          setIsCollapsed={setIsCollapsed}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          userProfile={userProfile}
          stats={stats}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navigation - Simple without back button */}
        <nav className="sticky top-0 z-40 bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
          <div className="flex justify-between items-center">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-gray-900 truncate">
                {userProfile.name}
              </h1>
              <p className="text-sm text-gray-600 truncate">
                {userProfile.email} - {t(`roles.${userProfile.role}`)}
              </p>
            </div>
            
            <div className="flex items-center space-x-4 flex-shrink-0">
              <span className="text-sm text-gray-600 hidden lg:block truncate">
                {user.email}
              </span>
              <LanguageSwitcher />
              <Button 
                variant="outline" 
                className="rounded-none"
                size="sm"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">{t('auth.signOut')}</span>
              </Button>
            </div>
          </div>
        </nav>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto p-6">
          <UserProfileContent 
            activeTab={activeTab} 
            userProfile={userProfile}
            stats={stats}
            programs={programs}
            tests={tests}
            payments={payments}
            visits={visits}
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardWidget;
