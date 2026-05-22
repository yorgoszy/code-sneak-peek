import React from "react";
import { Sidebar } from "@/components/Sidebar";
import { CoachSidebar } from "@/components/CoachSidebar";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { useAuth } from "@/hooks/useAuth";
import { CyclePage } from "@/components/cycle/CyclePage";
import { Navigate } from "react-router-dom";

const CycleWithSidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);
  const { isCoach, isAdmin, userProfile, loading } = useRoleCheck();
  const { user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Φόρτωση...</div>
      </div>
    );
  }

  // Only female users can access this page
  if (!userProfile || userProfile.gender !== "female") {
    return <Navigate to="/dashboard" replace />;
  }

  const isCoachOnly = isCoach() && !isAdmin();
  const SidebarComponent = isCoachOnly ? CoachSidebar : Sidebar;

  return (
    <div className="flex min-h-screen w-full">
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <div
        className={`fixed lg:relative inset-y-0 left-0 z-50 transform transition-transform duration-200 ease-in-out ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <SidebarComponent isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      </div>

      <div className="flex-1 overflow-auto">
        <div className="lg:hidden sticky top-0 z-30 bg-background border-b p-2 flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsMobileOpen(true)}
            className="rounded-none"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Κύκλος Περιόδου</h1>
        </div>

        <main className="p-3 lg:p-4">
          <div className="hidden lg:flex items-center justify-between mb-2">
            <div>
              <h1 className="text-lg font-bold">Κύκλος Περιόδου</h1>
              <p className="text-xs text-muted-foreground">
                Παρακολούθηση κύκλου και αυτόματη ένδειξη φάσης προπόνησης
              </p>
            </div>
          </div>
          <CyclePage userId={userProfile.id} ownerName={userProfile.name} />
        </main>
      </div>
    </div>
  );
};

export default CycleWithSidebar;
