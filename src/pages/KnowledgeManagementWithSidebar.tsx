import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { CoachSidebar } from "@/components/CoachSidebar";
import KnowledgeManagement from "./KnowledgeManagement";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { useEffectiveCoachId } from "@/hooks/useEffectiveCoachId";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Menu, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const KnowledgeManagementWithSidebar: React.FC = () => {
  const { isAdmin } = useRoleCheck();
  const { effectiveCoachId } = useEffectiveCoachId();
  const { signOut } = useAuth();
  const isMobile = useIsMobile();
  const [isTablet, setIsTablet] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  useEffect(() => {
    const checkTablet = () => {
      setIsTablet(window.innerWidth >= 768 && window.innerWidth <= 1024);
    };
    checkTablet();
    window.addEventListener('resize', checkTablet);
    return () => window.removeEventListener('resize', checkTablet);
  }, []);

  const showSidebarButton = isMobile || isTablet;

  const handleSignOut = async () => {
    await signOut();
  };

  const SidebarComponent = isAdmin() ? Sidebar : CoachSidebar;

  return (
    <div className="flex min-h-screen w-full">
      {/* Desktop Sidebar */}
      {!showSidebarButton && (
        <div className="block">
          {isAdmin() ? (
            <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
          ) : (
            <CoachSidebar
              isCollapsed={isCollapsed}
              setIsCollapsed={setIsCollapsed}
              contextCoachId={effectiveCoachId}
            />
          )}
        </div>
      )}

      {/* Mobile/Tablet Sidebar Overlay */}
      {showSidebarButton && showMobileSidebar && (
        <div className="fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowMobileSidebar(false)}
          />
          <div className="relative w-64 h-full">
            {isAdmin() ? (
              <Sidebar isCollapsed={false} setIsCollapsed={setIsCollapsed} />
            ) : (
              <CoachSidebar
                isCollapsed={false}
                setIsCollapsed={setIsCollapsed}
                contextCoachId={effectiveCoachId}
              />
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header with mobile menu button */}
        {showSidebarButton && (
          <div className="sticky top-0 z-40 bg-background border-b border-border p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMobileSidebar(true)}
                  className="rounded-none"
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <h1 className="text-lg font-semibold">Knowledge Base</h1>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  className="rounded-none"
                  onClick={handleSignOut}
                  size="sm"
                >
                  <LogOut className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className={`flex-1 overflow-auto ${isMobile ? '' : ''}`}>
          <KnowledgeManagement />
        </main>
      </div>
    </div>
  );
};

export default KnowledgeManagementWithSidebar;
