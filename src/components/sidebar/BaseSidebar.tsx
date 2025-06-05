
import React from 'react';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface BaseSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  headerContent: React.ReactNode;
  navigationContent: React.ReactNode;
  bottomContent?: React.ReactNode;
  className?: string;
}

export const BaseSidebar: React.FC<BaseSidebarProps> = ({
  isCollapsed,
  setIsCollapsed,
  headerContent,
  navigationContent,
  bottomContent,
  className = ""
}) => {
  return (
    <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-80'
    } ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[#00ffba] rounded-none flex items-center justify-center">
                <img 
                  src="/lovable-uploads/411c56db-a47b-4665-b608-2e6230baf4b4.png" 
                  alt="Logo" 
                  className="w-6 h-6"
                />
              </div>
              {headerContent}
            </div>
          )}
          {isCollapsed && (
            <div className="w-10 h-10 bg-[#00ffba] rounded-none flex items-center justify-center mx-auto">
              <img 
                src="/lovable-uploads/411c56db-a47b-4665-b608-2e6230baf4b4.png" 
                alt="Logo" 
                className="w-6 h-6"
              />
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="rounded-none"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4">
        {navigationContent}
      </nav>

      {/* Bottom Content */}
      {bottomContent && (
        <div className="mt-auto p-4 border-t border-gray-200">
          {bottomContent}
        </div>
      )}
    </div>
  );
};
