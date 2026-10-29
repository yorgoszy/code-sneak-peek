import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRoleCheck } from '@/hooks/useRoleCheck';
import { useIsMobile } from '@/hooks/use-mobile';
import { CoachProvider, useCoachContext } from '@/contexts/CoachContext';
import { Button } from '@/components/ui/button';
import { LogOut, ArrowLeft } from 'lucide-react';
import { CustomLoadingScreen } from '@/components/ui/custom-loading';
import { MaintenanceGuard } from '@/components/maintenance/MaintenanceGuard';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';


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
  const navigate = useNavigate();
  const location = useLocation();

  // Κρύβουμε το κουμπί Επιστροφή στην ίδια τη σελίδα Επισκόπηση
  const isOverviewPage = location.pathname.startsWith('/dashboard/coach-overview');

  // Όνομα του προπονητή που βλέπουμε αυτή τη στιγμή
  const { data: coachProfile } = useQuery({
    queryKey: ['coach-layout-profile', coachId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_users')
        .select('name, avatar_url, photo_url')
        .eq('id', coachId as string)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: Boolean(coachId),
    staleTime: 60_000,
  });

  const coachName = coachProfile?.name || title || 'Προπονητής';
  const coachAvatar = coachProfile?.avatar_url || coachProfile?.photo_url || null;


  const handleBackToOverview = () => {
    navigate(coachId ? `/dashboard/coach-overview?coachId=${coachId}` : '/dashboard/coach-overview');
  };

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
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        {showHeader && (
          <div className="sticky top-0 z-40 bg-white border-b border-gray-200 p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {!isOverviewPage && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBackToOverview}
                    className="rounded-none text-[#004aad]"
                    aria-label="Επιστροφή στην Επισκόπηση"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span className="hidden md:inline ml-1">Επιστροφή</span>
                  </Button>
                )}
                <div className="flex items-center gap-2 min-w-0">
                  {coachAvatar && (
                    <img
                      src={coachAvatar}
                      alt=""
                      className="h-7 w-7 shrink-0 rounded-full object-cover"
                    />
                  )}
                  <div className="min-w-0">
                    <h1 className="truncate text-lg font-semibold text-[#004aad]">{coachName}</h1>
                    {title && (
                      <p className="truncate text-xs text-[#004aad]">{title}</p>
                    )}
                  </div>
                </div>

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
