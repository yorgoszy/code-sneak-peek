
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

const UserProfile = () => {
  const { userId } = useParams();
  const { user: currentUser, loading, signOut, isAuthenticated } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [profileLoading, setProfileLoading] = useState(true);

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
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar - hidden on mobile */}
      <div className="hidden md:block">
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
        {/* Top Navigation */}
        <nav className="bg-white border-b border-gray-200 px-2 md:px-4 lg:px-6 py-2 md:py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2 md:space-x-4">
              <Link to="/dashboard/users">
                <Button variant="outline" size="sm" className="rounded-none text-xs md:text-sm p-1 md:p-2">
                  <ArrowLeft className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                  <span className="hidden sm:inline">Επιστροφή</span>
                </Button>
              </Link>
              <div>
                <h1 className="text-lg md:text-2xl font-bold text-gray-900">
                  <span className="hidden sm:inline">Προφίλ:</span> {userProfile.name}
                </h1>
                <p className="text-xs md:text-sm text-gray-600 hidden md:block">
                  {userProfile.email} - {userProfile.role}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 md:space-x-4">
              <span className="text-xs md:text-sm text-gray-600 hidden lg:block">
                {currentUser?.email}
              </span>
              <Button 
                variant="outline" 
                size="sm"
                className="rounded-none text-xs md:text-sm p-1 md:p-2"
                onClick={handleSignOut}
              >
                <LogOut className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Αποσύνδεση</span>
              </Button>
            </div>
          </div>
        </nav>

        {/* Mobile Tabs - shown only on mobile */}
        <div className="md:hidden bg-white border-b border-gray-200 px-2 py-2">
          <div className="flex space-x-1 overflow-x-auto">
            {[
              { key: "overview", label: "Επισκόπηση" },
              { key: "programs", label: "Προγράμματα" },
              { key: "calendar", label: "Ημερολόγιο" },
              { key: "tests", label: "Τεστ" },
              { key: "payments", label: "Πληρωμές" }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1 text-xs font-medium rounded-none whitespace-nowrap ${
                  activeTab === tab.key ? 'bg-[#00ffba] text-black' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Profile Content */}
        <div className="flex-1 p-2 md:p-4 lg:p-6 overflow-hidden">
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
