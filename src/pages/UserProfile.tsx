
import { useState, useEffect } from "react";
import { useParams, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { Button } from "@/components/ui/button";
import { LogOut, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserProfileContent } from "@/components/user-profile/UserProfileContent";
import { useUserProfileData } from "@/components/user-profile/hooks/useUserProfileData";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTranslation } from 'react-i18next';
import { useWorkoutStatsSync } from "@/hooks/useWorkoutStatsSync";
import { MaintenanceGuard } from "@/components/maintenance/MaintenanceGuard";

const UserProfile = () => {
  const { userId } = useParams();
  const location = useLocation();
  const { user: currentUser, loading, signOut, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [profileLoading, setProfileLoading] = useState(true);

  const { isFederation, userProfile: loggedInProfile, loading: roleLoading } = useRoleCheck();


  // Handle tab query parameter
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  const { stats, programs, tests, payments, visits } = useUserProfileData(userProfile, !!userProfile);
  
  // Sync workout stats for AI
  useWorkoutStatsSync(userId);

  useEffect(() => {
    if (userId) {
      fetchUserProfile();
    }
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      setProfileLoading(true);
      const { data } = await supabase
        .from('app_users')
        .select('*')
        .eq('id', userId)
        .single();
      
      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (!roleLoading && isFederation() && loggedInProfile?.id === userId) {
    return <Navigate to="/dashboard/federation-overview" replace />;
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">{t('userProfile.title')}</p>
          <Link to="/dashboard/users">
            <Button variant="outline" className="mt-4 rounded-none">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('common.back')}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Club profiles use the same dashboard shell as coach pages, including admin previews.
  if (userProfile.role === 'club') {
    return <Navigate to={`/dashboard/coach-overview?coachId=${userProfile.id}`} replace />;
  }

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <MaintenanceGuard userRole={userProfile?.role}>
    <div className="min-h-screen bg-gray-50 flex">
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navigation */}
        <nav className="sticky top-0 z-40 bg-white border-b border-gray-200 px-2 md:px-6 py-2 md:py-4 shadow-sm">
          <div className="flex justify-between items-center gap-1 md:gap-2">
            <div className="flex items-center space-x-1 md:space-x-4 min-w-0 flex-1">
              <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                <Avatar className="h-8 w-8 md:h-10 md:w-10 flex-shrink-0">
                  <AvatarImage src={userProfile.photo_url || userProfile.avatar_url || ''} alt={userProfile.name} />
                  <AvatarFallback className="rounded-none text-xs md:text-sm">
                    {userProfile.name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                <h1 className="text-sm md:text-2xl font-bold text-gray-900 truncate">
                  {userProfile.name}
                </h1>
                <p className="text-[10px] md:text-sm text-gray-600 truncate hidden sm:block">
                  {userProfile.email} - {t(`roles.${userProfile.role}`)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-1 md:space-x-4 flex-shrink-0">
              <span className="text-xs md:text-sm text-gray-600 hidden lg:block truncate">
                {currentUser?.email}
              </span>
              <LanguageSwitcher />
              <Button 
                variant="outline" 
                className="rounded-none h-8 px-2 md:px-4"
                size="sm"
                onClick={handleSignOut}
              >
                <LogOut className="h-3 w-3 md:h-4 md:w-4 md:mr-2" />
                <span className="hidden md:inline text-xs md:text-sm">{t('auth.signOut')}</span>
              </Button>
            </div>
          </div>
        </nav>

        {/* Profile Content */}
        <div className="flex-1 p-3 md:p-6">
          <UserProfileContent
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            userProfile={userProfile}
            stats={stats}
            programs={programs}
            tests={tests}
            payments={payments}
            visits={visits}
            onOfferRejected={() => {}}
          />
        </div>
      </div>
    </div>
    </MaintenanceGuard>
  );
};

export default UserProfile;
