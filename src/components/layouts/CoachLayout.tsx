import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRoleCheck } from '@/hooks/useRoleCheck';
import { useIsMobile } from '@/hooks/use-mobile';
import { CoachProvider, useCoachContext } from '@/contexts/CoachContext';
import { CoachSidebar } from '@/components/CoachSidebar';
import { Button } from '@/components/ui/button';
import { Menu, LogOut } from 'lucide-react';
import { CustomLoadingScreen } from '@/components/ui/custom-loading';
import { MaintenanceGuard } from '@/components/maintenance/MaintenanceGuard';

interface CoachLayoutContentProps {
  children: React.ReactNode;
  title?: string;
  showHeader?: boolean;
}

const CoachLayoutContent: React.FC<CoachLayoutContentProps> = ({ 
  children, 
  title,
  showHeader = true 
}) => {
  const { signOut } = useAuth();
  const { coachId, isLoading } = useCoachContext();
  const isMobile = useIsMobile();
  const [isTablet, setIsTablet] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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

  if (isLoading) {
    return <CustomLoadingScreen />;
  }

  // Αν δεν υπάρχει coachId, redirect στο dashboard
  if (!coachId) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex w-full">
      {/* Desktop Sidebar */}
      {!showSidebarButton && (
        <div className="block">
          <CoachSidebar 
            isCollapsed={sidebarCollapsed} 
            setIsCollapsed={setSidebarCollapsed}
            contextCoachId={coachId}
          />
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
            <CoachSidebar 
              isCollapsed={false} 
              setIsCollapsed={setSidebarCollapsed}
              contextCoachId={coachId}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header with mobile menu button */}
        {showSidebarButton && showHeader && (
          <div className="sticky top-0 z-40 bg-white border-b border-gray-200 p-3 md:p-4">
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
                {title && (
                  <h1 className="text-lg font-semibold">{title}</h1>
                )}
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
        <div className={`flex-1 ${isMobile ? 'p-3' : 'p-6'}`}>
          {children}
        </div>
      </div>
    </div>
  );
};

interface CoachLayoutProps {
  children?: React.ReactNode;
  title?: string;
  showHeader?: boolean;
  requireAuth?: boolean;
  ContentComponent?: React.ComponentType;
}

export const CoachLayout: React.FC<CoachLayoutProps> = ({ 
  children, 
  title,
  showHeader = true,
  requireAuth = true,
  ContentComponent
}) => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { loading: rolesLoading } = useRoleCheck();

  if (authLoading || rolesLoading) {
    return <CustomLoadingScreen />;
  }

  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <CoachProvider>
      <MaintenanceGuard userRole="coach">
        <CoachLayoutContent title={title} showHeader={showHeader}>
          {ContentComponent ? <ContentComponent /> : children}
        </CoachLayoutContent>
      </MaintenanceGuard>
    </CoachProvider>
  );
};
