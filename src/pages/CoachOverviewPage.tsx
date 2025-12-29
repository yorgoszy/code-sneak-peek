import { useState, useEffect } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CoachSidebar } from "@/components/CoachSidebar";
import { Button } from "@/components/ui/button";
import { LogOut, Menu } from "lucide-react";
import { toast } from "sonner";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { CoachOverview } from "@/components/coach/CoachOverview";

const CoachOverviewPage = () => {
  const [searchParams] = useSearchParams();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const { userProfile, isAdmin, isCoach, loading: roleLoading } = useRoleCheck();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("Αποσυνδεθήκατε επιτυχώς");
    } catch (error: any) {
      toast.error("Σφάλμα κατά την αποσύνδεση");
    }
  };

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-gray-500">Φόρτωση...</span>
      </div>
    );
  }

  if (!userProfile || (!isCoach() && !isAdmin())) {
    return <Navigate to="/dashboard" replace />;
  }

  const coachIdFromUrl = searchParams.get('coachId');
  const effectiveCoachId = isAdmin() && coachIdFromUrl ? coachIdFromUrl : userProfile.id;

  return (
    <div className="min-h-screen bg-gray-50 flex w-full">
      <div className="hidden lg:block">
        <CoachSidebar
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          contextCoachId={effectiveCoachId}
        />
      </div>

      {showMobileSidebar && (
        <div
          className="fixed inset-0 z-50 bg-black/50 lg:hidden"
          onClick={() => setShowMobileSidebar(false)}
        >
          <div
            className="w-64 h-full bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <CoachSidebar
              isCollapsed={false}
              setIsCollapsed={() => {}}
              contextCoachId={effectiveCoachId}
            />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden rounded-none"
              onClick={() => setShowMobileSidebar(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">Επισκόπηση</h1>
              <p className="text-xs text-gray-500">Coach Dashboard</p>
            </div>
          </div>

          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className="rounded-none"
          >
            <LogOut className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Αποσύνδεση</span>
          </Button>
        </header>

        <main className="flex-1 p-4 overflow-auto">
          <div className="max-w-6xl mx-auto">
            <CoachOverview coachId={effectiveCoachId} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default CoachOverviewPage;
