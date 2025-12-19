import React, { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import AnnualPlanning from '@/pages/AnnualPlanning';

export const AnnualPlanningWithSidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main className="flex-1 transition-all duration-300">
        <AnnualPlanning />
      </main>
    </div>
  );
};

export default AnnualPlanningWithSidebar;
