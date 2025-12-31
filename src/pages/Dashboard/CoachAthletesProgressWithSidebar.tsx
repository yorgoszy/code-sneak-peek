import { CoachSidebar } from "@/components/CoachSidebar";
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Menu, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { UserProgressSection } from "@/components/user-profile/UserProgressSection";
import { CustomLoadingScreen } from "@/components/ui/custom-loading";
import { Combobox } from "@/components/ui/combobox";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { useSearchParams } from "react-router-dom";

export const CoachAthletesProgressWithSidebar = () => {
  const isMobile = useIsMobile();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showTabletSidebar, setShowTabletSidebar] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  
  const { user, signOut } = useAuth();
  const { userProfile, isAdmin } = useRoleCheck();
  const [searchParams] = useSearchParams();

  // Determine the effective coach ID
  const effectiveCoachId = useMemo(() => {
    const urlCoachId = searchParams.get('coachId');
    if (urlCoachId && isAdmin()) {
      return urlCoachId;
    }
    return userProfile?.id;
  }, [searchParams, isAdmin, userProfile?.id]);

  // Detect tablet screen size
  useEffect(() => {
    const checkTablet = () => {
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };
    checkTablet();
    window.addEventListener('resize', checkTablet);
    return () => window.removeEventListener('resize', checkTablet);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setShowMobileSidebar(false);
    }
  }, [isMobile]);

  useEffect(() => {
    if (effectiveCoachId) {
      loadCoachAthletes();
    }
  }, [effectiveCoachId]);

  const loadCoachAthletes = async () => {
    if (!effectiveCoachId) return;
    
    try {
      setLoading(true);
      
      // Παίρνουμε τους αθλητές του coach από app_users
      const { data: athletes, error: athletesError } = await supabase
        .from('app_users')
        .select('id, name, email, avatar_url')
        .eq('coach_id', effectiveCoachId);

      if (athletesError) throw athletesError;

      if (!athletes || athletes.length === 0) {
        setUsers([]);
        setLoading(false);
        return;
      }

      // Βρίσκουμε ποιοι έχουν κάνει τεστ (coach tables) - τώρα με user_id
      const [strengthRes, anthropometricRes, enduranceRes, jumpRes, functionalRes] = await Promise.all([
        supabase.from('coach_strength_test_sessions').select('user_id').eq('coach_id', effectiveCoachId),
        supabase.from('coach_anthropometric_test_sessions').select('user_id').eq('coach_id', effectiveCoachId),
        supabase.from('coach_endurance_test_sessions').select('user_id').eq('coach_id', effectiveCoachId),
        supabase.from('coach_jump_test_sessions').select('user_id').eq('coach_id', effectiveCoachId),
        supabase.from('coach_functional_test_sessions').select('user_id').eq('coach_id', effectiveCoachId),
      ]);

      // Συλλέγουμε τα unique user IDs που έχουν τεστ
      const userIdsWithTests = new Set([
        ...(strengthRes.data?.map(u => u.user_id).filter(Boolean) || []),
        ...(anthropometricRes.data?.map(u => u.user_id).filter(Boolean) || []),
        ...(enduranceRes.data?.map(u => u.user_id).filter(Boolean) || []),
        ...(jumpRes.data?.map(u => u.user_id).filter(Boolean) || []),
        ...(functionalRes.data?.map(u => u.user_id).filter(Boolean) || []),
      ]);

      // Φιλτράρουμε μόνο τους αθλητές που έχουν τεστ
      const athletesWithTests = athletes.filter(u => userIdsWithTests.has(u.id));

      setUsers(athletesWithTests);
    } catch (error) {
      console.error('Error loading coach athletes:', error);
    } finally {
      setLoading(false);
    }
  };

  const userOptions = useMemo(() => 
    (users || []).map(user => ({ 
      value: user.id, 
      label: user.name,
      searchTerms: `${user.name} ${user.email || ''}`,
      avatarUrl: user.avatar_url
    })),
    [users]
  );

  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (loading) {
    return <CustomLoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-background flex w-full">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <CoachSidebar
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          contextCoachId={effectiveCoachId}
        />
      </div>

      {/* Tablet Sidebar Overlay */}
      {showTabletSidebar && isTablet && (
        <div className="fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowTabletSidebar(false)}
          />
          <div className="absolute left-0 top-0 h-full bg-background shadow-xl">
            <CoachSidebar
              isCollapsed={false}
              setIsCollapsed={() => {}}
              contextCoachId={effectiveCoachId}
            />
          </div>
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {showMobileSidebar && !isTablet && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowMobileSidebar(false)}
          />
          <div className="absolute left-0 top-0 h-full bg-background shadow-xl">
            <CoachSidebar
              isCollapsed={false}
              setIsCollapsed={() => {}}
              contextCoachId={effectiveCoachId}
            />
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col w-full">
        {/* Header for tablet/mobile */}
        <header className="h-14 md:h-16 flex items-center justify-between border-b bg-background px-4 md:px-6 lg:hidden">
          <div className="flex items-center">
            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-none mr-4"
              onClick={() => isTablet ? setShowTabletSidebar(true) : setShowMobileSidebar(true)}
            >
              <Menu className="h-4 w-4" />
            </Button>
            <h1 className="text-lg md:text-xl font-semibold">Πρόοδος Αθλητών</h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-none"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </header>
        
        <main className="flex-1 p-3 md:p-6 lg:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
            {/* Desktop Header */}
            <div className="hidden lg:block">
              <h1 className="text-2xl font-semibold mb-4">Πρόοδος Αθλητών</h1>
            </div>

            <Card className="rounded-none">
              <CardContent className="pt-6">
                <div className="space-y-3 md:space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Επιλέξτε Αθλητή
                    </label>
                    <div className="w-full">
                      <Combobox
                        options={userOptions}
                        value={selectedUserId}
                        onValueChange={handleUserSelect}
                        placeholder="Αναζήτηση με όνομα ή email..."
                        emptyMessage="Δεν βρέθηκε αθλητής με τεστ."
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {selectedUserId && effectiveCoachId && (
              <UserProgressSection 
                userId={selectedUserId} 
                useCoachTables={true}
                coachId={effectiveCoachId}
              />
            )}

            {!selectedUserId && (
              <Card className="rounded-none">
                <CardContent className="text-center py-12 text-muted-foreground">
                  {users.length === 0 
                    ? "Δεν υπάρχουν αθλητές με τεστ"
                    : "Επιλέξτε έναν αθλητή για να δείτε την πρόοδό του"
                  }
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default CoachAthletesProgressWithSidebar;
