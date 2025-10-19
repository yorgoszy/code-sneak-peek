import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { LogOut, Menu } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useDashboard } from "@/hooks/useDashboard";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { SchoolNotes } from "@/pages/SchoolNotes";

const SchoolNotesWithSidebar = () => {
  const { user, signOut } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const isMobile = useIsMobile();
  const { userProfile: dashboardUserProfile } = useDashboard();
  const { isAdmin } = useRoleCheck();

  // Check for tablet size
  useEffect(() => {
    const handleResize = () => {
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSignOut = async () => {
    await signOut();
  };

  if (!isAdmin()) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Δεν έχετε πρόσβαση σε αυτή τη σελίδα</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex w-full">
      <div className={`${isMobile || isTablet ? 'hidden' : 'block'}`}>
        <Sidebar 
          isCollapsed={isCollapsed} 
          setIsCollapsed={setIsCollapsed}
        />
      </div>

      {/* Mobile/Tablet Sidebar Overlay */}
      {(isMobile || isTablet) && (
        <div className={`fixed inset-0 z-50 ${showMobileSidebar ? 'block' : 'hidden'}`}>
          <div 
            className="absolute inset-0 bg-black/50" 
            onClick={() => setShowMobileSidebar(false)}
          />
          <div className="absolute left-0 top-0 h-full bg-white shadow-xl">
            <Sidebar
              isCollapsed={false}
              setIsCollapsed={() => {}}
            />
          </div>
        </div>
      )}
      
      {/* School Notes Content */}
      <div className="flex-1 overflow-auto">
        {/* Mobile/Tablet header with menu button */}
        {(isMobile || isTablet) && (
          <nav className="sticky top-0 z-40 bg-white border-b border-gray-200 px-3 py-4 shadow-sm lg:hidden">
            <div className="flex items-center justify-between">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowMobileSidebar(true)}
                className="rounded-none"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-lg font-semibold">Σχολικές Σημειώσεις</h1>
              <div className="w-8" /> {/* Spacer for centering */}
            </div>
          </nav>
        )}
        
        <div className={`${isMobile ? 'p-3' : 'p-6'}`}>
          <SchoolNotes />
        </div>
      </div>
    </div>
  );
};

export default SchoolNotesWithSidebar;
