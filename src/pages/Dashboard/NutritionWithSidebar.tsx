import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import { CoachSidebar } from '@/components/CoachSidebar';
import { NutritionPage } from '@/components/nutrition/NutritionPage';
import { CoachNutritionPage } from '@/components/nutrition/CoachNutritionPage';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { useRoleCheck } from '@/hooks/useRoleCheck';

export const NutritionWithSidebar = () => {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);
  const { isCoach, isAdmin } = useRoleCheck();

  const isCoachOnly = isCoach() && !isAdmin();
  const SidebarComponent = isCoachOnly ? CoachSidebar : Sidebar;
  const PageComponent = isCoachOnly ? CoachNutritionPage : NutritionPage;

  return (
    <div className="flex min-h-screen w-full">
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
      
      <div className={`
        fixed lg:relative inset-y-0 left-0 z-50 
        transform transition-transform duration-200 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <SidebarComponent isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      </div>
      
      <div className="flex-1 overflow-auto">
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
        
        <PageComponent />
      </div>
    </div>
  );
};

export default NutritionWithSidebar;
