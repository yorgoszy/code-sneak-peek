import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { HeartPulse, Menu } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { CoachSidebar } from '@/components/CoachSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useRoleCheck } from '@/hooks/useRoleCheck';
import { HeartRateContent } from '@/components/heart-rate/HeartRateContent';

const HeartRatePage = () => {
  const { isAdmin } = useRoleCheck();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const renderSidebar = () => isAdmin()
    ? <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
    : <CoachSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <div className="hidden lg:block">{renderSidebar()}</div>
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileOpen(false)} />
            <div className="relative w-64 h-full">{renderSidebar()}</div>
          </div>
        )}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="sticky top-0 z-40 bg-background border-b border-border p-3 lg:hidden">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => setIsMobileOpen(true)} className="rounded-none">
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-lg font-semibold">Heart Rate (HR+)</h1>
            </div>
          </div>

          <main className="flex-1 p-3 lg:p-4 overflow-auto space-y-2">
            <div className="hidden lg:flex items-center gap-2">
              <HeartPulse className="h-5 w-5" />
              <h1 className="text-xl font-bold">Heart Rate (HR+)</h1>
            </div>

            <HeartRateContent />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default HeartRatePage;
