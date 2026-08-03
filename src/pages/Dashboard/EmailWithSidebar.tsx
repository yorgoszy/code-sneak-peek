import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Sidebar } from "@/components/Sidebar";
import { EmailClient } from "@/pages/EmailClient";

export default function EmailWithSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <div className="hidden lg:block">
          <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 overflow-hidden">
            <EmailClient />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
