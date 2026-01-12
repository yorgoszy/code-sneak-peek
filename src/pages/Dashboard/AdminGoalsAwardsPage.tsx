import React from 'react';
import { Sidebar } from "@/components/Sidebar";
import { GoalsAwardsContent } from "@/components/goals/GoalsAwardsContent";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { useState } from "react";

const AdminGoalsAwardsPage = () => {
  const { userProfile } = useRoleCheck();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  return (
    <div className="flex min-h-screen w-full">
      <Sidebar isCollapsed={sidebarCollapsed} setIsCollapsed={setSidebarCollapsed} />
      <div className="flex-1 p-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Στόχοι & Βραβεία</h1>
            <p className="text-muted-foreground">Διαχείριση στόχων και βραβείων αθλητών</p>
          </div>
          <GoalsAwardsContent coachId={userProfile?.id} />
        </div>
      </div>
    </div>
  );
};

export default AdminGoalsAwardsPage;
