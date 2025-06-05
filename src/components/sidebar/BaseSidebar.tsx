
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
              <div className="w-10 h-10 rounded-none flex items-center justify-center overflow-hidden">
                <img 
                  src="/lovable-uploads/a9d8f326-52a1-4283-965a-c73fed3f73ec.png" 
                  alt="Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              {headerContent}
            </div>
          )}
          {isCollapsed && (
            <div className="w-10 h-10 rounded-none flex items-center justify-center mx-auto overflow-hidden">
              <img 
                src="/lovable-uploads/a9d8f326-52a1-4283-965a-c73fed3f73ec.png" 
                alt="Logo" 
                className="w-full h-full object-contain"
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
