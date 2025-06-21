
import { useState, useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { UserProfileSidebar } from "@/components/user-profile/UserProfileSidebar";
import { UserProfileContent } from "@/components/user-profile/UserProfileContent";
import { useUserProfileData } from "@/components/user-profile/hooks/useUserProfileData";
import { useIsMobile } from "@/hooks/use-mobile";

const UserProfile = () => {
  const { userId } = useParams();
  const { user: currentUser, loading, signOut, isAuthenticated } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [profileLoading, setProfileLoading] = useState(true);
  const isMobile = useIsMobile();

  const { stats, programs, tests, payments } = useUserProfileData(userProfile, !!userProfile);

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
          <p className="text-gray-600">Φόρτωση προφίλ χρήστη...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Δεν βρέθηκε το προφίλ χρήστη</p>
          <Link to="/dashboard/users">
            <Button variant="outline" className="mt-4 rounded-none">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Επιστροφή στους Χρήστες
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - Hidden on mobile, shown with overlay */}
      <div className={`${isMobile ? 'hidden' : 'block'}`}>
        <UserProfileSidebar 
          isCollapsed={isCollapsed} 
          setIsCollapsed={setIsCollapsed}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          userProfile={userProfile}
          stats={stats}
        />
      </div>

      {/* Mobile Sidebar */}
      {isMobile && (
        <UserProfileSidebar 
          isCollapsed={false} 
          setIsCollapsed={setIsCollapsed}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          userProfile={userProfile}
          stats={stats}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Navigation */}
        <nav className="bg-white border-b border-gray-200 px-3 md:px-6 py-3 md:py-4">
          <div className="flex justify-between items-center">
            <div className={`flex items-center space-x-2 md:space-x-4 ${isMobile ? 'ml-12' : ''}`}>
              <Link to="/dashboard/users">
                <Button variant="outline" size="sm" className="rounded-none text-xs md:text-sm px-2 md:px-4">
                  <ArrowLeft className="h-3 md:h-4 w-3 md:w-4 mr-1 md:mr-2" />
                  <span className="hidden sm:inline">Επιστροφή</span>
                </Button>
              </Link>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg md:text-2xl font-bold text-gray-900 truncate">
                  {isMobile ? userProfile.name : `Προφίλ: ${userProfile.name}`}
                </h1>
                <p className="text-xs md:text-sm text-gray-600 truncate">
                  {userProfile.email} - {userProfile.role}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 md:space-x-4">
              <span className="text-xs md:text-sm text-gray-600 hidden sm:block truncate">
                {currentUser?.email}
              </span>
              <Button 
                variant="outline" 
                className="rounded-none text-xs md:text-sm px-2 md:px-4"
                onClick={handleSignOut}
              >
                <LogOut className="h-3 md:h-4 w-3 md:w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Αποσύνδεση</span>
              </Button>
            </div>
          </div>
        </nav>

        {/* Profile Content */}
        <div className="flex-1 p-3 md:p-6">
          <UserProfileContent
            activeTab={activeTab}
            userProfile={userProfile}
            stats={stats}
            programs={programs}
            tests={tests}
            payments={payments}
          />
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
