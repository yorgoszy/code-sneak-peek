import { useState, useEffect } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CoachSidebar } from "@/components/CoachSidebar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Menu, LayoutDashboard, Settings } from "lucide-react";
import { toast } from "sonner";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { CoachProfileSettings } from "@/components/coach/CoachProfileSettings";
import { CoachOverview } from "@/components/coach/CoachOverview";

const CoachProfile = () => {
  const [searchParams] = useSearchParams();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const { userProfile, isAdmin, isCoach, loading: roleLoading } = useRoleCheck();

  useEffect(() => {
    const checkTablet = () => {
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };
    
    checkTablet();
    window.addEventListener('resize', checkTablet);
    return () => window.removeEventListener('resize', checkTablet);
  }, []);

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

  // Determine effective coachId
  const coachIdFromUrl = searchParams.get('coachId');
  const effectiveCoachId = isAdmin() && coachIdFromUrl ? coachIdFromUrl : userProfile.id;

  return (
    <div className="min-h-screen bg-gray-50 flex w-full">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <CoachSidebar
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          contextCoachId={effectiveCoachId}
        />
      </div>

      {/* Mobile/Tablet Sidebar Overlay */}
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
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
              <h1 className="text-lg font-semibold">Προφίλ Coach</h1>
              <p className="text-xs text-gray-500">Διαχείριση στοιχείων</p>
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

        {/* Content */}
        <main className="flex-1 p-4 overflow-auto">
          <div className="max-w-4xl mx-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 rounded-none mb-4">
                <TabsTrigger value="overview" className="rounded-none flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  Επισκόπηση
                </TabsTrigger>
                <TabsTrigger value="settings" className="rounded-none flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Ρυθμίσεις Προφίλ
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <CoachOverview coachId={effectiveCoachId} />
              </TabsContent>

              <TabsContent value="settings">
                <CoachProfileSettings coachId={effectiveCoachId} />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CoachProfile;
