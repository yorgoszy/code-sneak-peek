import { Sidebar } from "@/components/Sidebar";
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { UserProgressSection } from "@/components/user-profile/UserProgressSection";
import { CustomLoadingScreen } from "@/components/ui/custom-loading";
import { Combobox } from "@/components/ui/combobox";
import { useIsMobile } from "@/hooks/use-mobile";

export const AthletesProgressWithSidebar = () => {
  const isMobile = useIsMobile();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isMobile) {
      setShowMobileSidebar(false);
    }
  }, [isMobile]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);

      const [{ data: strengthUsers }, { data: anthropometricUsers }, { data: enduranceUsers }, { data: jumpUsers }, { data: functionalUsers }] = await Promise.all([
        supabase.from('strength_test_sessions').select('user_id, test_date').not('user_id', 'is', null),
        supabase.from('anthropometric_test_sessions').select('user_id, test_date').not('user_id', 'is', null),
        supabase.from('endurance_test_sessions').select('user_id, test_date').not('user_id', 'is', null),
        supabase.from('jump_test_sessions').select('user_id, test_date').not('user_id', 'is', null),
        supabase.from('functional_test_sessions').select('user_id, test_date').not('user_id', 'is', null)
      ]);

      const latestTestDateByUser = new Map<string, Date>();
      const addSession = (session: any) => {
        if (!session?.user_id || !session.test_date) return;
        const current = latestTestDateByUser.get(session.user_id);
        const date = new Date(session.test_date);
        if (!current || date > current) latestTestDateByUser.set(session.user_id, date);
      };

      [
        ...(strengthUsers || []),
        ...(anthropometricUsers || []),
        ...(enduranceUsers || []),
        ...(jumpUsers || []),
        ...(functionalUsers || [])
      ].forEach(addSession);

      const userIdsWithTests = Array.from(latestTestDateByUser.keys());

      if (userIdsWithTests.length === 0) {
        setUsers([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('app_users')
        .select('id, name, email, photo_url')
        .in('id', userIdsWithTests);

      if (error) throw error;

      const sortedUsers = (data || []).sort((a, b) => {
        const dateA = latestTestDateByUser.get(a.id) || new Date(0);
        const dateB = latestTestDateByUser.get(b.id) || new Date(0);
        if (dateB.getTime() !== dateA.getTime()) return dateB.getTime() - dateA.getTime();
        return (a.name || '').localeCompare(b.name || '', 'el');
      });

      setUsers(sortedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };


  const userOptions = useMemo(() => 
    (users || []).map(user => ({ 
      value: user.id, 
      label: user.name,
      searchTerms: `${user.name} ${user.email || ''}`,
      avatarUrl: user.photo_url
    })),
    [users]
  );

  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
  };

  if (loading) {
    return <CustomLoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar - Large screens only */}
      <div className="hidden lg:block">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
        />
      </div>
      
      {/* Mobile/Tablet Sidebar Overlay */}
      {showMobileSidebar && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowMobileSidebar(false)}
          />
          <div className="absolute left-0 top-0 h-full bg-white shadow-xl">
            <Sidebar
              isCollapsed={false}
              setIsCollapsed={() => {}}
            />
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col w-full">
        {/* Header */}
        <header className="h-14 md:h-16 flex items-center border-b bg-white px-4 md:px-6">
          <Button 
            variant="outline" 
            size="sm" 
            className="rounded-none lg:hidden mr-4"
            onClick={() => setShowMobileSidebar(true)}
          >
            <Menu className="h-4 w-4" />
          </Button>
          <h1 className="text-lg md:text-xl font-semibold">Πρόοδος Αθλητών</h1>
        </header>
        
        <main className="flex-1 p-3 md:p-6 lg:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
            <Card className="rounded-none">
              <CardContent className="pt-6">
                <div className="space-y-3 md:space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Επιλέξτε Αθλητή
                    </label>
                    <div className="w-full">
                      <Combobox
                        options={userOptions}
                        value={selectedUserId}
                        onValueChange={handleUserSelect}
                        placeholder="Αναζήτηση με όνομα ή email..."
                        emptyMessage="Δεν βρέθηκε χρήστης."
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {selectedUserId && (
              <Card className="rounded-none">
                <CardContent className="pt-4">
                  <UserProgressSection userId={selectedUserId} />
                </CardContent>
              </Card>
            )}

            {!selectedUserId && (
              <Card className="rounded-none">
                <CardContent className="text-center py-12 text-gray-500">
                  Επιλέξτε έναν αθλητή για να δείτε την πρόοδό του
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
