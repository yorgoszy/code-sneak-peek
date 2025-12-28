import { useMemo, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NewRecordTab } from "@/components/progress/NewRecordTab";
import { HistoryTab } from "@/components/progress/HistoryTab";
import { EnduranceRecordTab } from "@/components/progress/EnduranceRecordTab";
import { EnduranceHistoryTab } from "@/components/progress/EnduranceHistoryTab";
import { JumpRecordTab } from "@/components/progress/JumpRecordTab";
import { JumpHistoryTab } from "@/components/progress/JumpHistoryTab";
import { AnthropometricRecordTab } from "@/components/progress/AnthropometricRecordTab";
import { AnthropometricHistoryTab } from "@/components/progress/AnthropometricHistoryTab";
import { FunctionalRecordTab } from "@/components/progress/FunctionalRecordTab";
import { FunctionalHistoryTab } from "@/components/progress/FunctionalHistoryTab";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { useToast } from "@/hooks/use-toast";

interface CoachProgressTrackingProps {
  contextCoachId?: string;
}

type CoachAthlete = {
  id: string; // app_users.id (IMPORTANT: tests tables reference app_users)
  name: string;
  email: string;
  coach_user_id: string; // coach_users.id (for reference/debug)
};

export default function CoachProgressTracking({ contextCoachId }: CoachProgressTrackingProps) {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const { userProfile, isAdmin } = useRoleCheck();

  const [users, setUsers] = useState<CoachAthlete[]>([]);
  const [exercises, setExercises] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // Get the effective coach ID
  const urlCoachId = searchParams.get('coachId');
  const effectiveCoachId = contextCoachId || urlCoachId || (isAdmin() ? undefined : userProfile?.id);

  useEffect(() => {
    if (effectiveCoachId) {
      fetchCoachAthletesAsAppUsers();
    }
    fetchExercises();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveCoachId]);

  const fetchCoachAthletesAsAppUsers = async () => {
    if (!effectiveCoachId) return;

    try {
      // 1) Fetch coach athletes (coach_users)
      const { data: coachUsers, error: coachUsersError } = await supabase
        .from('coach_users')
        .select('id, name, email')
        .eq('coach_id', effectiveCoachId)
        .order('name');

      if (coachUsersError) throw coachUsersError;

      const coachUserRows = (coachUsers || []).filter(u => u.email);
      const emails = coachUserRows.map(u => u.email);

      if (emails.length === 0) {
        setUsers([]);
        return;
      }

      // 2) Fetch matching app_users by email
      const { data: appUsers, error: appUsersError } = await supabase
        .from('app_users')
        .select('id, name, email')
        .in('email', emails);

      if (appUsersError) throw appUsersError;

      const emailToAppUser = new Map<string, { id: string; name: string; email: string }>();
      (appUsers || []).forEach((u) => emailToAppUser.set(u.email, u));

      // 3) Create missing app_users (so progress tests can reference them)
      const missingCoachUsers = coachUserRows.filter(cu => !emailToAppUser.has(cu.email));

      if (missingCoachUsers.length > 0) {
        const rowsToInsert = missingCoachUsers.map(cu => ({
          name: cu.name,
          email: cu.email,
          role: 'athlete',
          user_status: 'active',
          coach_id: effectiveCoachId
        }));

        const { data: inserted, error: insertError } = await supabase
          .from('app_users')
          .insert(rowsToInsert)
          .select('id, name, email');

        if (insertError) {
          console.error('Error creating app_users for coach athletes:', insertError);
          toast({
            title: 'Σφάλμα',
            description: 'Δεν μπορώ να δημιουργήσω προφίλ αθλητών (app_users). Ελέγξτε τα δικαιώματα/RLS.',
            variant: 'destructive'
          });
        } else {
          (inserted || []).forEach((u) => emailToAppUser.set(u.email, u));
        }
      }

      // 4) Build users list for the UI using app_users.id (NOT coach_users.id)
      const merged: CoachAthlete[] = coachUserRows
        .map(cu => {
          const appUser = emailToAppUser.get(cu.email);
          if (!appUser) return null;
          return {
            id: appUser.id,
            name: appUser.name || cu.name,
            email: appUser.email,
            coach_user_id: cu.id
          };
        })
        .filter(Boolean) as CoachAthlete[];

      setUsers(merged);
    } catch (error) {
      console.error('Error fetching coach athletes:', error);
      toast({
        title: 'Σφάλμα',
        description: 'Αποτυχία φόρτωσης αθλητών coach.',
        variant: 'destructive'
      });
    }
  };

  const fetchExercises = async () => {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setExercises(data || []);
    } catch (error) {
      console.error('Error fetching exercises:', error);
    }
  };

  const handleRecordSaved = () => {
    setRefreshKey(prev => prev + 1);
  };

  // IMPORTANT: history filters must use app_users ids
  const coachAthleteAppUserIds = useMemo(() => users.map(u => u.id), [users]);

  return (
    <div className="p-2 sm:p-3 md:p-4 lg:p-6 space-y-3 sm:space-y-4 md:space-y-6 max-w-full overflow-x-hidden">
      <h1 className="text-lg sm:text-xl md:text-2xl font-bold">Καταγραφή Προόδου Αθλητών</h1>

      {users.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Δεν έχετε αθλητές ακόμα. Προσθέστε αθλητές από τη σελίδα "Οι Αθλητές μου".
        </div>
      ) : (
        <Tabs defaultValue="force-velocity" className="w-full">
          <TabsList className="rounded-none w-full grid grid-cols-3 lg:grid-cols-5 gap-0.5 sm:gap-1 p-0.5 sm:p-1 h-auto">
            <TabsTrigger value="force-velocity" className="rounded-none text-[10px] sm:text-xs md:text-sm px-1 sm:px-2 py-1.5 sm:py-2">
              Force/Velocity
            </TabsTrigger>
            <TabsTrigger value="endurance" className="rounded-none text-[10px] sm:text-xs md:text-sm px-1 sm:px-2 py-1.5 sm:py-2">
              Endurance
            </TabsTrigger>
            <TabsTrigger value="jump-profile" className="rounded-none text-[10px] sm:text-xs md:text-sm px-1 sm:px-2 py-1.5 sm:py-2">
              Jump Profile
            </TabsTrigger>
            <TabsTrigger value="anthropometric" className="rounded-none text-[10px] sm:text-xs md:text-sm px-1 sm:px-2 py-1.5 sm:py-2">
              Σωματομετρικά
            </TabsTrigger>
            <TabsTrigger value="functional" className="rounded-none text-[10px] sm:text-xs md:text-sm px-1 sm:px-2 py-1.5 sm:py-2">
              Λειτουργικά
            </TabsTrigger>
          </TabsList>

          <TabsContent value="force-velocity" className="mt-3 sm:mt-4 md:mt-6">
            <Tabs defaultValue="new" className="w-full">
              <TabsList className="rounded-none w-full bg-gray-100 h-7 sm:h-8">
                <TabsTrigger value="new" className="rounded-none flex-1 text-[10px] sm:text-xs py-1 px-1 sm:px-2">
                  Νέα Καταγραφή
                </TabsTrigger>
                <TabsTrigger value="history" className="rounded-none flex-1 text-[10px] sm:text-xs py-1 px-1 sm:px-2">
                  Ιστορικό
                </TabsTrigger>
              </TabsList>

              <TabsContent value="new" className="mt-3 sm:mt-4 md:mt-6">
                <NewRecordTab
                  users={users}
                  exercises={exercises}
                  onRecordSaved={handleRecordSaved}
                />
              </TabsContent>

              <TabsContent value="history" className="mt-3 sm:mt-4 md:mt-6">
                <HistoryTab key={refreshKey} coachUserIds={coachAthleteAppUserIds} />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="endurance" className="mt-3 sm:mt-4 md:mt-6">
            <Tabs defaultValue="new" className="w-full">
              <TabsList className="rounded-none w-full bg-gray-100 h-7 sm:h-8">
                <TabsTrigger value="new" className="rounded-none flex-1 text-[10px] sm:text-xs py-1 px-1 sm:px-2">
                  Νέα Καταγραφή
                </TabsTrigger>
                <TabsTrigger value="history" className="rounded-none flex-1 text-[10px] sm:text-xs py-1 px-1 sm:px-2">
                  Ιστορικό
                </TabsTrigger>
              </TabsList>

              <TabsContent value="new" className="mt-3 sm:mt-4 md:mt-6">
                <EnduranceRecordTab
                  users={users}
                  exercises={exercises}
                  onRecordSaved={handleRecordSaved}
                />
              </TabsContent>

              <TabsContent value="history" className="mt-3 sm:mt-4 md:mt-6">
                <EnduranceHistoryTab key={refreshKey} coachUserIds={coachAthleteAppUserIds} />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="jump-profile" className="mt-3 sm:mt-4 md:mt-6">
            <Tabs defaultValue="new" className="w-full">
              <TabsList className="rounded-none w-full bg-gray-100 h-7 sm:h-8">
                <TabsTrigger value="new" className="rounded-none flex-1 text-[10px] sm:text-xs py-1 px-1 sm:px-2">
                  Νέα Καταγραφή
                </TabsTrigger>
                <TabsTrigger value="history" className="rounded-none flex-1 text-[10px] sm:text-xs py-1 px-1 sm:px-2">
                  Ιστορικό
                </TabsTrigger>
              </TabsList>

              <TabsContent value="new" className="mt-3 sm:mt-4 md:mt-6">
                <JumpRecordTab
                  users={users}
                  onRecordSaved={handleRecordSaved}
                />
              </TabsContent>

              <TabsContent value="history" className="mt-3 sm:mt-4 md:mt-6">
                <JumpHistoryTab key={refreshKey} coachUserIds={coachAthleteAppUserIds} />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="anthropometric" className="mt-3 sm:mt-4 md:mt-6">
            <Tabs defaultValue="new" className="w-full">
              <TabsList className="rounded-none w-full bg-gray-100 h-7 sm:h-8">
                <TabsTrigger value="new" className="rounded-none flex-1 text-[10px] sm:text-xs py-1 px-1 sm:px-2">
                  Νέα Καταγραφή
                </TabsTrigger>
                <TabsTrigger value="history" className="rounded-none flex-1 text-[10px] sm:text-xs py-1 px-1 sm:px-2">
                  Ιστορικό
                </TabsTrigger>
              </TabsList>

              <TabsContent value="new" className="mt-3 sm:mt-4 md:mt-6">
                <AnthropometricRecordTab
                  users={users}
                  onRecordSaved={handleRecordSaved}
                />
              </TabsContent>

              <TabsContent value="history" className="mt-3 sm:mt-4 md:mt-6">
                <AnthropometricHistoryTab key={refreshKey} coachUserIds={coachAthleteAppUserIds} />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="functional" className="mt-3 sm:mt-4 md:mt-6">
            <Tabs defaultValue="new" className="w-full">
              <TabsList className="rounded-none w-full bg-gray-100 h-7 sm:h-8">
                <TabsTrigger value="new" className="rounded-none flex-1 text-[10px] sm:text-xs py-1 px-1 sm:px-2">
                  Νέα Καταγραφή
                </TabsTrigger>
                <TabsTrigger value="history" className="rounded-none flex-1 text-[10px] sm:text-xs py-1 px-1 sm:px-2">
                  Ιστορικό
                </TabsTrigger>
              </TabsList>

              <TabsContent value="new" className="mt-3 sm:mt-4 md:mt-6">
                <FunctionalRecordTab
                  users={users}
                  onRecordSaved={handleRecordSaved}
                />
              </TabsContent>

              <TabsContent value="history" className="mt-3 sm:mt-4 md:mt-6">
                <FunctionalHistoryTab key={refreshKey} coachUserIds={coachAthleteAppUserIds} />
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
