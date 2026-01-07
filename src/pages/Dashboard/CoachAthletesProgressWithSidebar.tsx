import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { UserProgressSection } from "@/components/user-profile/UserProgressSection";
import { CustomLoadingScreen } from "@/components/ui/custom-loading";
import { Combobox } from "@/components/ui/combobox";
import { CoachLayout } from "@/components/layouts/CoachLayout";
import { useCoachContext } from "@/contexts/CoachContext";

const CoachAthletesProgressContent = () => {
  const { coachId } = useCoachContext();
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (coachId) {
      loadCoachAthletes();
    }
  }, [coachId]);

  const loadCoachAthletes = async () => {
    if (!coachId) return;
    
    try {
      setLoading(true);
      
      // Παίρνουμε τους αθλητές του coach από app_users
      const { data: athletes, error: athletesError } = await supabase
        .from('app_users')
        .select('id, name, email, photo_url, avatar_url')
        .eq('coach_id', coachId);

      if (athletesError) throw athletesError;

      if (!athletes || athletes.length === 0) {
        setUsers([]);
        setLoading(false);
        return;
      }

      // Βρίσκουμε ποιοι έχουν κάνει τεστ (coach tables) - τώρα με user_id
      const [strengthRes, anthropometricRes, enduranceRes, jumpRes, functionalRes] = await Promise.all([
        supabase.from('coach_strength_test_sessions').select('user_id').eq('coach_id', coachId),
        supabase.from('coach_anthropometric_test_sessions').select('user_id').eq('coach_id', coachId),
        supabase.from('coach_endurance_test_sessions').select('user_id').eq('coach_id', coachId),
        supabase.from('coach_jump_test_sessions').select('user_id').eq('coach_id', coachId),
        supabase.from('coach_functional_test_sessions').select('user_id').eq('coach_id', coachId),
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
      avatarUrl: user.photo_url || user.avatar_url
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
    <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
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

      {selectedUserId && coachId && (
        <UserProgressSection 
          userId={selectedUserId} 
          useCoachTables={true}
          coachId={coachId}
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
  );
};

export const CoachAthletesProgressWithSidebar = () => {
  return (
    <CoachLayout title="Πρόοδος Αθλητών">
      <CoachAthletesProgressContent />
    </CoachLayout>
  );
};

export default CoachAthletesProgressWithSidebar;
