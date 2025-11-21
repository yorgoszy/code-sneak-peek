import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { UserProgressSection } from "@/components/user-profile/UserProgressSection";
import { CustomLoadingScreen } from "@/components/ui/custom-loading";
import { Combobox } from "@/components/ui/combobox";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";

const AthletesProgressWidget = () => {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Φέρνουμε χρήστες που έχουν τουλάχιστον ένα test session
      const { data: strengthUsers } = await supabase
        .from('strength_test_sessions')
        .select('user_id')
        .not('user_id', 'is', null);

      const { data: anthropometricUsers } = await supabase
        .from('anthropometric_test_sessions')
        .select('user_id')
        .not('user_id', 'is', null);

      const { data: enduranceUsers } = await supabase
        .from('endurance_test_sessions')
        .select('user_id')
        .not('user_id', 'is', null);

      const { data: jumpUsers } = await supabase
        .from('jump_test_sessions')
        .select('user_id')
        .not('user_id', 'is', null);

      // Συλλέγουμε όλα τα unique user IDs
      const userIdsWithTests = new Set([
        ...(strengthUsers?.map(u => u.user_id) || []),
        ...(anthropometricUsers?.map(u => u.user_id) || []),
        ...(enduranceUsers?.map(u => u.user_id) || []),
        ...(jumpUsers?.map(u => u.user_id) || [])
      ]);

      if (userIdsWithTests.size === 0) {
        setUsers([]);
        setLoading(false);
        return;
      }

      // Φέρνουμε τα στοιχεία των χρηστών που έχουν tests
      const { data, error } = await supabase
        .from('app_users')
        .select('id, name, email, photo_url')
        .in('id', Array.from(userIdsWithTests))
        .order('name', { ascending: true });

      if (error) throw error;
      setUsers(data || []);
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

  if (authLoading || loading) {
    return <CustomLoadingScreen />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <Card className="rounded-none">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Πρόοδος Αθλητών</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Επιλέξτε Αθλητή
                </label>
                <div className="w-full md:w-96">
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
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Πρόοδος</CardTitle>
            </CardHeader>
            <CardContent>
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
    </div>
  );
};

export default AthletesProgressWidget;
