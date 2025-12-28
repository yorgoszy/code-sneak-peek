import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { CoachSidebar } from "@/components/CoachSidebar";
import { Button } from "@/components/ui/button";
import { LogOut, Menu } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import CoachProgressTracking from "@/pages/CoachProgressTracking";

const CoachProgressTrackingWithSidebar = () => {
  const { signOut } = useAuth();
  const [searchParams] = useSearchParams();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showTabletSidebar, setShowTabletSidebar] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const isMobile = useIsMobile();
  const { userProfile, isAdmin } = useRoleCheck();

  // Get the effective coach ID from URL or current user
  const urlCoachId = searchParams.get('coachId');
  const effectiveCoachId = urlCoachId || (isAdmin() ? undefined : userProfile?.id);

  // Check for tablet size
  useEffect(() => {
    const checkTablet = () => {
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };
    
    checkTablet();
    window.addEventListener('resize', checkTablet);
    return () => window.removeEventListener('resize', checkTablet);
  }, []);

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        {!isMobile && !isTablet && (
          <CoachSidebar 
            isCollapsed={isCollapsed} 
            setIsCollapsed={setIsCollapsed}
            contextCoachId={effectiveCoachId}
          />
        )}

        {/* Tablet Sidebar */}
        {isTablet && showTabletSidebar && (
          <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowTabletSidebar(false)}>
            <div className="w-64 h-full bg-white" onClick={(e) => e.stopPropagation()}>
              <CoachSidebar 
                isCollapsed={false} 
                setIsCollapsed={() => {}}
                contextCoachId={effectiveCoachId}
              />
            </div>
          </div>
        )}

        {/* Mobile Sidebar */}
        {isMobile && showMobileSidebar && (
          <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowMobileSidebar(false)}>
            <div className="w-64 h-full bg-white" onClick={(e) => e.stopPropagation()}>
              <CoachSidebar 
                isCollapsed={false} 
                setIsCollapsed={() => {}}
                contextCoachId={effectiveCoachId}
              />
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tablet Header */}
          {isTablet && (
            <div className="bg-white border-b border-gray-200 p-3 flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowTabletSidebar(true)}
                className="rounded-none"
              >
                <Menu className="h-6 w-6" />
              </Button>
              <h1 className="text-lg font-semibold">Πρόοδος Αθλητών</h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                className="rounded-none"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          )}

          {/* Mobile Header */}
          {isMobile && (
            <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowMobileSidebar(true)}
                className="rounded-none"
              >
                <Menu className="h-6 w-6" />
              </Button>
              <h1 className="text-lg font-semibold">Πρόοδος Αθλητών</h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                className="rounded-none"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          )}
          
          <CoachProgressTracking contextCoachId={effectiveCoachId} />
        </div>
      </div>
    </div>
  );
};

export default CoachProgressTrackingWithSidebar;
