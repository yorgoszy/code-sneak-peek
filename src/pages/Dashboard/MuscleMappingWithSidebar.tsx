import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import { MuscleMapping } from '@/components/muscle-mapping/MuscleMapping';

export const MuscleMappingWithSidebar = () => {
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className="flex-1 overflow-auto">
        <MuscleMapping />
      </div>
    </div>
  );
};

export default MuscleMappingWithSidebar;
