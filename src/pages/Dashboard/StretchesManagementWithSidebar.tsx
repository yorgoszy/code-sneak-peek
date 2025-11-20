import React, { useState } from 'react';
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { LogOut, Menu } from "lucide-react";
import { StretchesManagement } from "@/components/stretches/StretchesManagement";
import { useAuth } from "@/hooks/useAuth";
import { useDashboard } from "@/hooks/useDashboard";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRoleCheck } from "@/hooks/useRoleCheck";

const StretchesManagementWithSidebar = () => {
  const { user, signOut } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const isMobile = useIsMobile();
  const { userProfile: dashboardUserProfile } = useDashboard();
  const { isAdmin } = useRoleCheck();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex w-full">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobile && showMobileSidebar && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowMobileSidebar(false)}
          />
          <div className="relative w-64 h-full">
            <Sidebar 
              isCollapsed={false} 
              setIsCollapsed={setIsCollapsed}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        {isMobile && (
          <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMobileSidebar(true)}
              className="rounded-none"
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 truncate max-w-[150px]">
                {dashboardUserProfile?.name || user?.email}
              </span>
              <Button 
                variant="ghost"
                size="sm"
                className="rounded-none"
                onClick={handleSignOut}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        )}

        {/* Desktop Header */}
        {!isMobile && (
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Διατάσεις</h1>
                <p className="text-gray-600">
                  Διαχείριση διατάσεων και συνδέσεων με ασκήσεις
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  {dashboardUserProfile?.name || user?.email}
                  {isAdmin() && <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded">Admin</span>}
                </span>
                <Button 
                  variant="outline" 
                  className="rounded-none"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Αποσύνδεση
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Stretches Content */}
        <div className="flex-1 overflow-auto">
          <StretchesManagement />
        </div>
      </div>
    </div>
  );
};

export default StretchesManagementWithSidebar;
