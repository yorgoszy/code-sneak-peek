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
    // Set custom manifest for athletes progress widget
    const manifestData = {
      name: 'Πρόοδος Αθλητών - HYPERKIDS',
      short_name: 'Πρόοδος',
      description: 'Πρόοδος Αθλητών HYPERKIDS',
      theme_color: '#00ffba',
      background_color: '#ffffff',
      display: 'standalone',
      orientation: 'portrait',
      start_url: '/athletes-progress-widget',
      scope: '/athletes-progress-widget',
      icons: [
        {
          src: '/pwa-icons/progress-icon.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable'
        }
      ]
    };

    const manifestBlob = new Blob([JSON.stringify(manifestData)], { type: 'application/json' });
    const manifestURL = URL.createObjectURL(manifestBlob);
    
    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = manifestURL;
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
      URL.revokeObjectURL(manifestURL);
    };
  }, []);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);

      // Φέρνουμε τα test sessions μαζί με την ημερομηνία του τεστ
      const [{ data: strengthUsers }, { data: anthropometricUsers }, { data: enduranceUsers }, { data: jumpUsers }] = await Promise.all([
        supabase.from('strength_test_sessions').select('user_id, test_date').not('user_id', 'is', null),
        supabase.from('anthropometric_test_sessions').select('user_id, test_date').not('user_id', 'is', null),
        supabase.from('endurance_test_sessions').select('user_id, test_date').not('user_id', 'is', null),
        supabase.from('jump_test_sessions').select('user_id, test_date').not('user_id', 'is', null)
      ]);

      // Υπολογίζουμε την πιο πρόσφατη ημερομηνία τεστ ανά χρήστη
      const latestTestDateByUser = new Map<string, Date>();
      const addSession = (session: { user_id: string | null; test_date: string | null } | null) => {
        if (!session?.user_id || !session.test_date) return;
        const current = latestTestDateByUser.get(session.user_id);
        const date = new Date(session.test_date);
        if (!current || date > current) {
          latestTestDateByUser.set(session.user_id, date);
        }
      };

      [...(strengthUsers || []), ...(anthropometricUsers || []), ...(enduranceUsers || []), ...(jumpUsers || [])].forEach(addSession);

      const userIdsWithTests = Array.from(latestTestDateByUser.keys());

      if (userIdsWithTests.length === 0) {
        setUsers([]);
        setLoading(false);
        return;
      }

      // Φέρνουμε τα στοιχεία των χρηστών που έχουν tests
      const { data, error } = await supabase
        .from('app_users')
        .select('id, name, email, photo_url')
        .in('id', userIdsWithTests);

      if (error) throw error;

      // Ταξινόμηση κατά πιο πρόσφατο τεστ (desc) και μετά όνομα (asc)
      const sortedUsers = (data || []).sort((a, b) => {
        const dateA = latestTestDateByUser.get(a.id) || new Date(0);
        const dateB = latestTestDateByUser.get(b.id) || new Date(0);
        if (dateB.getTime() !== dateA.getTime()) {
          return dateB.getTime() - dateA.getTime();
        }
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
    </div>
  );
};

export default AthletesProgressWidget;
