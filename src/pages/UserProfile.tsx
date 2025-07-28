
import { useState, useEffect, useRef } from "react";
import { useParams, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, ArrowLeft, Menu } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { UserProfileSidebar } from "@/components/user-profile/UserProfileSidebar";
import { UserProfileContent } from "@/components/user-profile/UserProfileContent";
import { useUserProfileData } from "@/components/user-profile/hooks/useUserProfileData";
import { useIsMobile } from "@/hooks/use-mobile";

const UserProfile = () => {
  const { userId } = useParams();
  const location = useLocation();
  const { user: currentUser, loading, signOut, isAuthenticated } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [profileLoading, setProfileLoading] = useState(true);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const isMobile = useIsMobile();
  const sidebarRef = useRef<{ refreshOffers: () => void }>(null);

  // Handle tab query parameter
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  const { stats, programs, tests, payments, visits } = useUserProfileData(userProfile, !!userProfile);

  useEffect(() => {
    if (userId) {
      fetchUserProfile();
    }
  }, [userId]);

  // Close mobile sidebar when tab changes
  useEffect(() => {
    if (isMobile) {
      setShowMobileSidebar(false);
    }
  }, [activeTab]);

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

  const handleOfferRejected = () => {
    // Ανανεώνουμε το sidebar για να ενημερωθεί ο αριθμός προσφορών
    sidebarRef.current?.refreshOffers();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <UserProfileSidebar 
          ref={sidebarRef}
          isCollapsed={isCollapsed} 
          setIsCollapsed={setIsCollapsed}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          userProfile={userProfile}
          stats={stats}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobile && showMobileSidebar && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowMobileSidebar(false)}
          />
          <div className="relative w-64 h-full">
            <UserProfileSidebar 
              isCollapsed={false} 
              setIsCollapsed={setIsCollapsed}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              userProfile={userProfile}
              stats={stats}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navigation */}
        <nav className="sticky top-0 z-40 bg-white border-b border-gray-200 px-3 md:px-6 py-4 shadow-sm">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2 md:space-x-4 min-w-0">
              {/* Mobile menu button */}
              {isMobile && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-none md:hidden"
                  onClick={() => setShowMobileSidebar(true)}
                >
                  <Menu className="h-4 w-4" />
                </Button>
              )}
              
              <Link to="/dashboard/users">
                <Button variant="outline" size="sm" className="rounded-none">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Επιστροφή</span>
                </Button>
              </Link>
              
              <div className="min-w-0">
                <h1 className="text-lg md:text-2xl font-bold text-gray-900 truncate">
                  {userProfile.name}
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
                className="rounded-none"
                size={isMobile ? "sm" : "default"}
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 mr-0 md:mr-2" />
                <span className="hidden md:inline">Αποσύνδεση</span>
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
            onOfferRejected={handleOfferRejected}
          />
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
