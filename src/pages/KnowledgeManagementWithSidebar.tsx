import React, { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { CoachSidebar } from "@/components/CoachSidebar";
import KnowledgeManagement from "./KnowledgeManagement";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { useEffectiveCoachId } from "@/hooks/useEffectiveCoachId";

const KnowledgeManagementWithSidebar: React.FC = () => {
  const { isAdmin } = useRoleCheck();
  const { effectiveCoachId } = useEffectiveCoachId();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen w-full">
      {isAdmin() ? (
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      ) : (
        <CoachSidebar
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          contextCoachId={effectiveCoachId}
        />
      )}
      <main className="flex-1 overflow-auto">
        <KnowledgeManagement />
      </main>
    </div>
  );
};

export default KnowledgeManagementWithSidebar;
