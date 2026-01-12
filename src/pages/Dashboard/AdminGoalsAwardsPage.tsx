import React from 'react';
import { Sidebar } from "@/components/Sidebar";
import { GoalsAwardsContent } from "@/components/goals/GoalsAwardsContent";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

const AdminGoalsAwardsPage = () => {
  const { userProfile } = useRoleCheck();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  return (
    <div className="flex min-h-screen w-full">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar - hidden on mobile unless open */}
      <div className={`
        fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar isCollapsed={sidebarCollapsed} setIsCollapsed={setSidebarCollapsed} />
      </div>
      
      <div className="flex-1 min-w-0">
        {/* Mobile header with menu button */}
        <div className="lg:hidden sticky top-0 z-30 bg-background border-b p-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-none"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold">Στόχοι & Βραβεία</h1>
        </div>
        
        <div className="p-3 sm:p-4 md:p-6">
          <div className="space-y-4 sm:space-y-6">
            <div className="hidden lg:block">
              <h1 className="text-xl sm:text-2xl font-bold">Στόχοι & Βραβεία</h1>
              <p className="text-sm text-muted-foreground">Διαχείριση στόχων και βραβείων αθλητών</p>
            </div>
            <GoalsAwardsContent coachId={userProfile?.id} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminGoalsAwardsPage;
