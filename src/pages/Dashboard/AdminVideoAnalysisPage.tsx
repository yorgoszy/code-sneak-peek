import React, { useState, useEffect } from 'react';
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { AdminVideoAnalysisOverview } from "@/components/video-analysis/AdminVideoAnalysisOverview";

const AdminVideoAnalysisPage = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const isMobile = useIsMobile();

  // Check for tablet size
  useEffect(() => {
    const checkTabletSize = () => {
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };
    
    checkTabletSize();
    window.addEventListener('resize', checkTabletSize);
    
    return () => window.removeEventListener('resize', checkTabletSize);
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar - Large screens only */}
        <div className="hidden lg:block">
          <Sidebar
            isCollapsed={isCollapsed}
            setIsCollapsed={setIsCollapsed}
          />
        </div>
        
        {/* Mobile/Tablet Sidebar Overlay */}
        {showMobileSidebar && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div 
              className="absolute inset-0 bg-black bg-opacity-50"
              onClick={() => setShowMobileSidebar(false)}
            />
            <div className="absolute left-0 top-0 h-full bg-white shadow-xl">
              <Sidebar
                isCollapsed={false}
                setIsCollapsed={() => {}}
              />
            </div>
          </div>
        )}
        
        {/* Content */}
        <div className="flex-1 overflow-auto">
          {/* Mobile/Tablet header with menu button */}
          {(isMobile || isTablet) && (
            <nav className="sticky top-0 z-40 bg-white border-b border-gray-200 px-3 py-4 shadow-sm lg:hidden">
              <div className="flex items-center">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-none"
                  onClick={() => setShowMobileSidebar(true)}
                >
                  <Menu className="h-4 w-4" />
                </Button>
                <h1 className="ml-4 text-lg font-semibold text-gray-900">Video Analysis</h1>
              </div>
            </nav>
          )}
          
          <AdminVideoAnalysisOverview />
        </div>
      </div>
    </div>
  );
};

export default AdminVideoAnalysisPage;
