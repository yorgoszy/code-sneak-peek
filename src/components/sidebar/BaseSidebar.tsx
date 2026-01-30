
import React, { useRef, useEffect } from 'react';
import sidebarLogo from '@/assets/sidebar-logo.png';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocation } from "react-router-dom";

interface BaseSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  headerContent: React.ReactNode;
  navigationContent: React.ReactNode;
  bottomContent?: React.ReactNode;
  className?: string;
}

// Key for storing scroll position in sessionStorage
const SIDEBAR_SCROLL_KEY = 'sidebar-scroll-position';

export const BaseSidebar: React.FC<BaseSidebarProps> = ({
  isCollapsed,
  setIsCollapsed,
  headerContent,
  navigationContent,
  bottomContent,
  className = ""
}) => {
  const navRef = useRef<HTMLElement>(null);
  const location = useLocation();

  // Restore scroll position on mount and route changes
  useEffect(() => {
    const savedPosition = sessionStorage.getItem(SIDEBAR_SCROLL_KEY);
    if (savedPosition && navRef.current) {
      navRef.current.scrollTop = parseInt(savedPosition, 10);
    }
  }, [location.pathname]);

  // Save scroll position before navigation
  const handleScroll = () => {
    if (navRef.current) {
      sessionStorage.setItem(SIDEBAR_SCROLL_KEY, navRef.current.scrollTop.toString());
    }
  };

  return (
    <div
      className={`bg-background border-r border-border transition-all duration-300 h-screen sticky top-0 flex flex-col ${
        isCollapsed ? "w-16" : "w-80"
      } ${className}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          {/* Always show content on mobile, respect collapsed state on desktop */}
          <div className={`flex items-center space-x-3 ${isCollapsed ? "md:hidden" : ""}`}>
            <div className="w-10 h-10 rounded-none flex items-center justify-center overflow-hidden bg-card">
              <img
                src={sidebarLogo}
                alt="Hyperkids dashboard logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className={isCollapsed ? "block md:hidden" : "block"}>{headerContent}</div>
          </div>

          {/* Collapsed logo - only on desktop when collapsed */}
          {isCollapsed && (
            <div className="w-10 h-10 rounded-none flex items-center justify-center mx-auto overflow-hidden md:block hidden bg-card">
              <img
                src={sidebarLogo}
                alt="Hyperkids dashboard logo"
                className="w-full h-full object-contain"
              />
            </div>
          )}

          {/* Toggle button - hidden on mobile */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="rounded-none hidden md:block"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav 
        ref={navRef}
        onScroll={handleScroll}
        className="p-4 flex-1 overflow-y-auto max-h-[calc(100vh-120px)] scrollbar-none"
      >
        {navigationContent}
      </nav>

      {/* Bottom Content */}
      {bottomContent && (
        <div className="mt-auto p-4 border-t border-border">{bottomContent}</div>
      )}
    </div>
  );
};
