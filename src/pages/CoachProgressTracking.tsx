import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { useToast } from "@/hooks/use-toast";

import { CoachStrengthRecordTab } from "@/components/progress/coach/CoachStrengthRecordTab";
import { CoachStrengthHistoryTab } from "@/components/progress/coach/CoachStrengthHistoryTab";
import { CoachEnduranceRecordTab } from "@/components/progress/coach/CoachEnduranceRecordTab";
import { CoachEnduranceHistoryTab } from "@/components/progress/coach/CoachEnduranceHistoryTab";
import { CoachJumpRecordTab } from "@/components/progress/coach/CoachJumpRecordTab";
import { CoachJumpHistoryTab } from "@/components/progress/coach/CoachJumpHistoryTab";
import { CoachAnthropometricRecordTab } from "@/components/progress/coach/CoachAnthropometricRecordTab";
import { CoachAnthropometricHistoryTab } from "@/components/progress/coach/CoachAnthropometricHistoryTab";
import { CoachFunctionalRecordTab } from "@/components/progress/coach/CoachFunctionalRecordTab";
import { CoachFunctionalHistoryTab } from "@/components/progress/coach/CoachFunctionalHistoryTab";

interface CoachProgressTrackingProps {
  contextCoachId?: string;
}

type CoachAthlete = {
  id: string;
  name: string;
  email: string;
  avatar_url?: string | null;
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
      fetchCoachAthletes();
    }
    fetchExercises();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveCoachId]);

  const fetchCoachAthletes = async () => {
    if (!effectiveCoachId) return;

    try {
      // Fetch coach athletes from app_users table (not coach_users)
      const { data: athletes, error } = await supabase
        .from('app_users')
        .select('id, name, email, avatar_url')
        .eq('coach_id', effectiveCoachId)
        .order('name');

      if (error) throw error;

      setUsers((athletes || []).map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        avatar_url: u.avatar_url
      })));
    } catch (error) {
      console.error('Error fetching coach athletes:', error);
      toast({
        title: 'Σφάλμα',
        description: 'Αποτυχία φόρτωσης αθλητών.',
        variant: 'destructive'
      });
    }
  };

  const fetchExercises = async () => {
    try {
      const { data: allExercises, error } = await supabase
        .from('exercises')
        .select('id, name');

      if (error) throw error;

      // Fetch usage counts from strength_test_attempts (main data source)
      const { data: usageCounts } = await supabase
        .from('strength_test_attempts')
        .select('exercise_id');

      // Count frequency per exercise
      const frequencyMap = new Map<string, number>();
      (usageCounts || []).forEach((row: any) => {
        if (row.exercise_id) {
          frequencyMap.set(row.exercise_id, (frequencyMap.get(row.exercise_id) || 0) + 1);
        }
      });

      // Sort: most used first, then alphabetically
      const sorted = (allExercises || []).sort((a, b) => {
        const countA = frequencyMap.get(a.id) || 0;
        const countB = frequencyMap.get(b.id) || 0;
        if (countA !== countB) return countB - countA;
        return a.name.localeCompare(b.name);
      });

      setExercises(sorted);
    } catch (error) {
      console.error('Error fetching exercises:', error);
    }
  };

  const handleRecordSaved = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (!effectiveCoachId) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Δεν βρέθηκε coachId.
      </div>
    );
  }

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
                <CoachStrengthRecordTab
                  coachId={effectiveCoachId}
                  users={users}
                  exercises={exercises}
                  onRecordSaved={handleRecordSaved}
                />
              </TabsContent>

              <TabsContent value="history" className="mt-3 sm:mt-4 md:mt-6">
                <CoachStrengthHistoryTab coachId={effectiveCoachId} key={refreshKey} />
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
                <CoachEnduranceRecordTab
                  coachId={effectiveCoachId}
                  users={users}
                  exercises={exercises}
                  onRecordSaved={handleRecordSaved}
                />
              </TabsContent>

              <TabsContent value="history" className="mt-3 sm:mt-4 md:mt-6">
                <CoachEnduranceHistoryTab coachId={effectiveCoachId} key={refreshKey} />
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
                <CoachJumpRecordTab
                  coachId={effectiveCoachId}
                  users={users}
                  onRecordSaved={handleRecordSaved}
                />
              </TabsContent>

              <TabsContent value="history" className="mt-3 sm:mt-4 md:mt-6">
                <CoachJumpHistoryTab coachId={effectiveCoachId} key={refreshKey} />
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
                <CoachAnthropometricRecordTab
                  coachId={effectiveCoachId}
                  users={users}
                  onRecordSaved={handleRecordSaved}
                />
              </TabsContent>

              <TabsContent value="history" className="mt-3 sm:mt-4 md:mt-6">
                <CoachAnthropometricHistoryTab coachId={effectiveCoachId} key={refreshKey} />
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
                <CoachFunctionalRecordTab
                  coachId={effectiveCoachId}
                  users={users}
                  onRecordSaved={handleRecordSaved}
                />
              </TabsContent>

              <TabsContent value="history" className="mt-3 sm:mt-4 md:mt-6">
                <CoachFunctionalHistoryTab coachId={effectiveCoachId} key={refreshKey} />
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
