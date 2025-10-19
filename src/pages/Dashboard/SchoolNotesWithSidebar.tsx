import React, { useState, useEffect } from 'react';
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboard } from "@/contexts/DashboardContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { Menu } from "lucide-react";
import { AdminSchoolNotes } from "@/components/school-notes/AdminSchoolNotes";

export const SchoolNotesWithSidebar = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const { signOut } = useAuth();
  const { refreshSidebar } = useDashboard();
  const isMobile = useIsMobile();
  const { isAdmin } = useRoleCheck();

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

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-xl text-gray-600">Access Denied. Admin only.</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop/Tablet Sidebar */}
      {!isMobile && !isTablet && (
        <Sidebar 
          isCollapsed={isSidebarCollapsed}
          onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      )}

      {/* Mobile/Tablet Sidebar Overlay */}
      {(isMobile || isTablet) && showMobileSidebar && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowMobileSidebar(false)}
          />
          <div className="fixed left-0 top-0 h-full z-50 w-64">
            <Sidebar 
              isCollapsed={false}
              onToggle={() => setShowMobileSidebar(false)}
            />
          </div>
        </>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile/Tablet Header */}
        {(isMobile || isTablet) && (
          <div className="sticky top-0 z-30 flex items-center gap-4 p-4 bg-white border-b">
            <button
              onClick={() => setShowMobileSidebar(true)}
              className="p-2 hover:bg-gray-100 rounded-none"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold">Σχολικές Σημειώσεις</h1>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <AdminSchoolNotes />
        </div>
      </div>
    </div>
  );
};
