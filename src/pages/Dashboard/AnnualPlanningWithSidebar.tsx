import React, { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import AnnualPlanning from '@/pages/AnnualPlanning';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

export const AnnualPlanningWithSidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Mobile Sidebar Toggle */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        className="fixed top-2 left-2 z-50 lg:hidden rounded-none h-10 w-10"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Mobile Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar - hidden on mobile unless toggled */}
      <div className={`
        fixed lg:relative inset-y-0 left-0 z-40 
        transform transition-transform duration-300 ease-in-out
        ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      </div>

      <main className="flex-1 transition-all duration-300 pt-14 lg:pt-0">
        <AnnualPlanning />
      </main>
    </div>
  );
};

export default AnnualPlanningWithSidebar;
