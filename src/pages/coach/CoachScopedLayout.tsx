import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CoachSidebar } from '@/components/CoachSidebar';
import { useRoleCheck } from '@/hooks/useRoleCheck';
import { supabase } from '@/integrations/supabase/client';

interface CoachScopedLayoutProps {
  title: string;
  children: React.ReactNode;
}

/**
 * Standalone layout for coach-scoped pages (/coach/:coachId/*).
 * Renders CoachSidebar in context of the URL coachId, with mobile/tablet header.
 */
export const CoachScopedLayout: React.FC<CoachScopedLayoutProps> = ({ title, children }) => {
  const { coachId } = useParams<{ coachId: string }>();
  const { isAdmin, userProfile, loading } = useRoleCheck();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [coachExists, setCoachExists] = useState<boolean | null>(null);

  useEffect(() => {
    if (!coachId) return;
    supabase
      .from('app_users')
      .select('id, role')
      .eq('id', coachId)
      .maybeSingle()
      .then(({ data }) => setCoachExists(!!data && (data.role === 'coach' || data.role === 'admin')));
  }, [coachId]);

  if (loading || coachExists === null) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Φόρτωση...</div>;
  }

  if (!coachExists) {
    return <Navigate to="/dashboard/users" replace />;
  }

  // Authorization: admin OR the coach themselves
  const isOwnCoach = userProfile?.id === coachId;
  if (!isAdmin() && !isOwnCoach) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex w-full bg-background">
      <div className="hidden lg:block">
        <CoachSidebar
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          contextCoachId={coachId}
        />
      </div>

      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileOpen(false)} />
          <div className="relative w-64 h-full">
            <CoachSidebar
              isCollapsed={false}
              setIsCollapsed={setIsCollapsed}
              contextCoachId={coachId}
            />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <div className="sticky top-0 z-40 bg-background border-b border-border p-3 lg:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMobileOpen(true)}
                className="rounded-none"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-lg font-semibold">{title}</h1>
            </div>
          </div>
        </div>

        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
