import React, { useState } from 'react';
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useDashboard } from "@/hooks/useDashboard";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { BookingSectionsManagement } from "@/components/admin/BookingSectionsManagement";

const BookingSectionsWithSidebar = () => {
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
        {/* Header with mobile menu button */}
        {(isMobile || window.innerWidth <= 1024) && (
          <div className="sticky top-0 z-40 bg-white border-b border-gray-200 p-3 md:p-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMobileSidebar(true)}
                className="rounded-none"
              >
                <Menu className="h-5 w-5" />
              </Button>
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

        {/* Booking Sections Management Content */}
        <div className={`flex-1 ${isMobile ? 'p-3' : 'p-3 md:p-6'}`}>
          <div className="max-w-7xl mx-auto">
            <div className={`flex items-center justify-between ${isMobile ? 'mb-4' : 'mb-8'}`}>
              <div>
                <h1 className={`${isMobile ? 'text-xl' : 'text-2xl lg:text-3xl'} font-bold text-gray-900 ${isMobile ? 'mb-1' : 'mb-2'}`}>
                  {isMobile ? 'Τμήματα' : 'Διαχείριση Τμημάτων'}
                </h1>
                {!isMobile && (
                  <p className="text-gray-600">
                    Διαχειριστείτε τα τμήματα και τις ρυθμίσεις κρατήσεων
                  </p>
                )}
              </div>
              
              {/* Desktop header controls */}
              {!isMobile && window.innerWidth > 1024 && (
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
              )}
            </div>

            <BookingSectionsManagement />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingSectionsWithSidebar;