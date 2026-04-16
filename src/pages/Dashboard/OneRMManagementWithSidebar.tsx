import { Sidebar } from "@/components/Sidebar";
import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { OneRMManagement } from "@/components/one-rm/OneRMManagement";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

export const OneRMManagementWithSidebar = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const renderSidebar = () => (
    <Sidebar isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} />
  );

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          {renderSidebar()}
        </div>

        {/* Mobile/Tablet sidebar overlay */}
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileOpen(false)} />
            <div className="relative w-64 h-full">
              {renderSidebar()}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile/Tablet Header */}
          <div className="sticky top-0 z-40 bg-background border-b border-border p-3 lg:hidden">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => setIsMobileOpen(true)} className="rounded-none">
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-lg font-semibold">1RM Management</h1>
            </div>
          </div>

          <main className="flex-1 p-3 sm:p-4 lg:p-6 overflow-auto">
            <OneRMManagement />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
