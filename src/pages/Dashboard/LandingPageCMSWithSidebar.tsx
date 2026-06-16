import React, { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { LogOut, Menu, ExternalLink } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDashboard } from '@/hooks/useDashboard';
import { useIsMobile } from '@/hooks/use-mobile';
import { useRoleCheck } from '@/hooks/useRoleCheck';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ThemeEditor } from '@/components/landing-cms/ThemeEditor';
import { SectionsEditor } from '@/components/landing-cms/SectionsEditor';

const LandingPageCMSWithSidebar = () => {
  const { user, signOut } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const isMobile = useIsMobile();
  const { userProfile } = useDashboard();
  const { isAdmin } = useRoleCheck();

  return (
    <div className="min-h-screen bg-gray-50 flex w-full">
      <div className="hidden md:block">
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      </div>

      {isMobile && showMobileSidebar && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowMobileSidebar(false)} />
          <div className="relative w-64 h-full">
            <Sidebar isCollapsed={false} setIsCollapsed={setIsCollapsed} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 p-3 md:p-6">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              {isMobile && (
                <Button variant="outline" size="sm" className="rounded-none md:hidden" onClick={() => setShowMobileSidebar(true)}>
                  <Menu className="h-5 w-5" />
                </Button>
              )}
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">Landing Page</h1>
                <p className="text-sm text-gray-600">Διαχείριση περιεχομένου, εικόνων και θέματος της landing</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <a href="/" target="_blank" rel="noreferrer">
                <Button variant="outline" className="rounded-none" size="sm">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Προεπισκόπηση
                </Button>
              </a>
              <span className="text-sm text-gray-600 hidden md:inline">
                {userProfile?.name || user?.email}
                {isAdmin() && <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded">Admin</span>}
              </span>
              <Button variant="outline" className="rounded-none" size="sm" onClick={() => signOut()}>
                <LogOut className="h-4 w-4 mr-2" />
                Αποσύνδεση
              </Button>
            </div>
          </div>

          <Tabs defaultValue="sections" className="w-full">
            <TabsList className="rounded-none">
              <TabsTrigger value="sections" className="rounded-none">Sections</TabsTrigger>
              <TabsTrigger value="theme" className="rounded-none">Θέμα</TabsTrigger>
            </TabsList>
            <TabsContent value="sections" className="mt-4">
              <SectionsEditor />
            </TabsContent>
            <TabsContent value="theme" className="mt-4">
              <ThemeEditor />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default LandingPageCMSWithSidebar;
