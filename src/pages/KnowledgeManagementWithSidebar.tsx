import React, { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import KnowledgeManagement from "./KnowledgeManagement";

const KnowledgeManagementWithSidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main className="flex-1 overflow-auto">
        <KnowledgeManagement />
      </main>
    </div>
  );
};

export default KnowledgeManagementWithSidebar;
