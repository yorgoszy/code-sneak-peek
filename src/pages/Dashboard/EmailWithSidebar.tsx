import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Sidebar } from "@/components/Sidebar";
import { CoachSidebar } from "@/components/CoachSidebar";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { EmailClient } from "@/pages/EmailClient";

export default function EmailWithSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { isAdmin } = useRoleCheck();

  const renderSidebar = () =>
    isAdmin() ? (
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
    ) : (
      <CoachSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
    );

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <div className="hidden lg:block">{renderSidebar()}</div>

        {isMobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileOpen(false)} />
            <div className="relative w-64 h-full">{renderSidebar()}</div>
          </div>
        )}

        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 overflow-hidden">
            <EmailClient onOpenAppMenu={() => setIsMobileOpen(true)} />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
