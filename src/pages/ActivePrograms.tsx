
import React, { useState, useEffect } from 'react';
import { Sidebar } from "@/components/Sidebar";
import { ActiveProgramsList } from "@/components/active-programs/ActiveProgramsList";
import { useActivePrograms } from "@/hooks/useActivePrograms";

const ActivePrograms = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { programs, loading } = useActivePrograms();

  if (loading) {
    return (
      <div className="min-h-screen flex w-full">
        <Sidebar isCollapsed={sidebarCollapsed} setIsCollapsed={setSidebarCollapsed} />
        <div className="flex-1 p-6">
          <div className="text-center">Φόρτωση...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex w-full">
      <Sidebar isCollapsed={sidebarCollapsed} setIsCollapsed={setSidebarCollapsed} />
      <div className="flex-1 p-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ενεργά Προγράμματα</h1>
            <p className="text-gray-600">Προγράμματα που σας έχουν ανατεθεί και είναι ενεργά</p>
          </div>
          <ActiveProgramsList programs={programs} />
        </div>
      </div>
    </div>
  );
};

export default ActivePrograms;
