import { Sidebar } from "@/components/Sidebar";
import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { OneRMManagement } from "@/components/one-rm/OneRMManagement";

export const OneRMManagementWithSidebar = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gray-50">
        <Sidebar isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} />
        <div className="flex-1 flex flex-col">
          <main className="flex-1 p-4 md:p-6 lg:p-8">
            <OneRMManagement />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
