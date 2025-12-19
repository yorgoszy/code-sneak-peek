import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import PhaseConfig from '@/pages/PhaseConfig';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

export const PhaseConfigWithSidebar = () => {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  return (
    <div className="flex min-h-screen w-full">
      {/* Mobile sidebar overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
      
      {/* Sidebar - hidden on mobile unless open */}
      <div className={`
        fixed lg:relative inset-y-0 left-0 z-50 
        transform transition-transform duration-200 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      </div>
      
      <div className="flex-1 overflow-auto scrollbar-gold">
        {/* Mobile header with menu button */}
        <div className="lg:hidden sticky top-0 z-30 bg-background border-b p-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileOpen(true)}
            className="rounded-none"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
        
        <PhaseConfig />
      </div>
    </div>
  );
};

export default PhaseConfigWithSidebar;
