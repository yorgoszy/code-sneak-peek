import React, { useState } from 'react';
import { Sidebar } from "@/components/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { useAuth } from "@/hooks/useAuth";
import { useDashboard } from "@/hooks/useDashboard";
import { useIsMobile } from "@/hooks/use-mobile";
import AdminShop from "@/pages/AdminShop";

const AdminShopWithSidebar = () => {
  const { user, signOut } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const isMobile = useIsMobile();
  const { userProfile: dashboardUserProfile } = useDashboard();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <DashboardHeader
        userProfile={dashboardUserProfile}
        onSignOut={handleSignOut}
        onMobileMenuClick={() => setShowMobileSidebar(!showMobileSidebar)}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          isCollapsed={isCollapsed && !isMobile}
          setIsCollapsed={setIsCollapsed}
        />
        
        {/* Mobile Sidebar Overlay */}
        {isMobile && showMobileSidebar && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowMobileSidebar(false)}
          />
        )}
        
        {/* Admin Shop Content */}
        <div className="flex-1 overflow-auto">
          <AdminShop />
        </div>
      </div>
    </div>
  );
};

export default AdminShopWithSidebar;