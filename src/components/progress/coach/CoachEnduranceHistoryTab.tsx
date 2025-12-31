import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DeleteConfirmDialog } from "@/components/progress/DeleteConfirmDialog";
import { CoachSearchInput } from "./CoachSearchInput";

// Remove Greek accents for search
const removeAccents = (str: string): string => {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
};

interface CoachEnduranceHistoryTabProps {
  coachId: string;
}

export const CoachEnduranceHistoryTab: React.FC<CoachEnduranceHistoryTabProps> = ({ coachId }) => {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersMap, setUsersMap] = useState<Map<string, { name: string; email: string }>>(new Map());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (coachId) fetchSessions();
  }, [coachId]);

  const fetchSessions = async () => {
    try {
      const { data: appUsers } = await supabase
        .from('app_users')
        .select('id, name, email')
        .eq('coach_id', coachId);

      const userMap = new Map<string, { name: string; email: string }>();
      (appUsers || []).forEach(u => userMap.set(u.id, { name: u.name, email: u.email }));
      setUsersMap(userMap);

      const { data, error } = await supabase
        .from('coach_endurance_test_sessions')
        .select(`
          id, user_id, test_date, notes, created_at,
          coach_endurance_test_data (
            id, mas_meters, mas_minutes, mas_ms, mas_kmh, vo2_max, max_hr, resting_hr_1min,
            push_ups, pull_ups, crunches, t2b, farmer_kg, farmer_meters, farmer_seconds,
            sprint_meters, sprint_seconds, sprint_watt, sprint_resistance
          )
        `)
        .eq('coach_id', coachId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (sessionId: string) => {
    setSessionToDelete(sessionId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!sessionToDelete) return;
    try {
      await supabase.from('coach_endurance_test_data').delete().eq('test_session_id', sessionToDelete);
      await supabase.from('coach_endurance_test_sessions').delete().eq('id', sessionToDelete);
      toast({ title: "Επιτυχία", description: "Η καταγραφή διαγράφηκε" });
      fetchSessions();
    } catch (error) {
      toast({ title: "Σφάλμα", description: "Αποτυχία διαγραφής", variant: "destructive" });
    } finally {
      setDeleteDialogOpen(false);
      setSessionToDelete(null);
    }
  };

  // Filter sessions by search
  const filteredSessions = useMemo(() => {
    if (!searchTerm.trim()) return sessions;
    const searchLower = removeAccents(searchTerm.trim());
    return sessions.filter(session => {
      const user = usersMap.get(session.user_id);
      if (!user) return false;
      return removeAccents(user.name || '').includes(searchLower) || removeAccents(user.email || '').includes(searchLower);
    });
  }, [sessions, searchTerm, usersMap]);

  // Group by type
  const masSessions = useMemo(() => filteredSessions.filter(s => s.coach_endurance_test_data?.[0]?.mas_meters), [filteredSessions]);
  const cardiacSessions = useMemo(() => filteredSessions.filter(s => s.coach_endurance_test_data?.[0]?.max_hr || s.coach_endurance_test_data?.[0]?.resting_hr_1min), [filteredSessions]);
  const vo2Sessions = useMemo(() => filteredSessions.filter(s => s.coach_endurance_test_data?.[0]?.vo2_max), [filteredSessions]);
  const bodyweightSessions = useMemo(() => filteredSessions.filter(s => {
    const data = s.coach_endurance_test_data?.[0];
    return data?.push_ups || data?.pull_ups || data?.crunches || data?.t2b;
  }), [filteredSessions]);
  const farmerSessions = useMemo(() => filteredSessions.filter(s => s.coach_endurance_test_data?.[0]?.farmer_kg), [filteredSessions]);
  const sprintSessions = useMemo(() => filteredSessions.filter(s => s.coach_endurance_test_data?.[0]?.sprint_meters || s.coach_endurance_test_data?.[0]?.sprint_seconds), [filteredSessions]);

  if (loading) return <div className="text-center py-8 text-muted-foreground">Φόρτωση...</div>;
  if (sessions.length === 0) return <div className="text-center py-8 text-muted-foreground">Δεν υπάρχουν καταγραφές</div>;

  const renderCard = (session: any, type: string) => {
    const data = session.coach_endurance_test_data?.[0];
    if (!data) return null;

    return (
      <Card key={session.id} className="rounded-none min-w-[200px] shrink-0">
        <CardContent className="p-2 space-y-1">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold text-xs">{usersMap.get(session.user_id)?.name || 'Άγνωστος'}</span>
              <span className="text-[10px] text-muted-foreground ml-2">{format(new Date(session.test_date), 'dd/MM/yy')}</span>
            </div>
            <Button size="sm" variant="ghost" onClick={() => handleDeleteClick(session.id)} className="h-6 w-6 p-0">
              <Trash2 className="w-3 h-3 text-destructive" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-1 text-[10px]">
            {type === 'mas' && data.mas_meters && (
              <>
                <div className="flex justify-between"><span className="text-muted-foreground">Απόσταση:</span><span className="font-medium">{data.mas_meters}m</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Χρόνος:</span><span className="font-medium">{data.mas_minutes}'</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">MAS:</span><span className="font-bold text-[#cb8954]">{data.mas_ms?.toFixed(2)} m/s</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">MAS:</span><span className="font-bold text-[#cb8954]">{data.mas_kmh?.toFixed(2)} km/h</span></div>
              </>
            )}
            {type === 'cardiac' && (
              <>
                {data.max_hr && <div className="flex justify-between col-span-2"><span className="text-muted-foreground">Max HR:</span><span className="font-bold text-red-500">{data.max_hr} bpm</span></div>}
                {data.resting_hr_1min && <div className="flex justify-between col-span-2"><span className="text-muted-foreground">Resting HR:</span><span className="font-bold text-blue-500">{data.resting_hr_1min} bpm</span></div>}
              </>
            )}
            {type === 'vo2' && data.vo2_max && (
              <div className="flex justify-between col-span-2"><span className="text-muted-foreground">VO2 Max:</span><span className="font-bold text-[#cb8954]">{data.vo2_max}</span></div>
            )}
            {type === 'bodyweight' && (
              <>
                {data.push_ups && <div className="flex justify-between"><span className="text-muted-foreground">Push Ups:</span><span className="font-bold">{data.push_ups}</span></div>}
                {data.pull_ups && <div className="flex justify-between"><span className="text-muted-foreground">Pull Ups:</span><span className="font-bold">{data.pull_ups}</span></div>}
                {data.crunches && <div className="flex justify-between"><span className="text-muted-foreground">Crunches:</span><span className="font-bold">{data.crunches}</span></div>}
                {data.t2b && <div className="flex justify-between"><span className="text-muted-foreground">T2B:</span><span className="font-bold">{data.t2b}</span></div>}
              </>
            )}
            {type === 'farmer' && (
              <>
                {data.farmer_kg && <div className="flex justify-between"><span className="text-muted-foreground">Βάρος:</span><span className="font-bold">{data.farmer_kg} kg</span></div>}
                {data.farmer_meters && <div className="flex justify-between"><span className="text-muted-foreground">Απόσταση:</span><span className="font-bold">{data.farmer_meters} m</span></div>}
                {data.farmer_seconds && <div className="flex justify-between"><span className="text-muted-foreground">Χρόνος:</span><span className="font-bold">{data.farmer_seconds} sec</span></div>}
              </>
            )}
            {type === 'sprint' && (
              <>
                {data.sprint_meters && <div className="flex justify-between"><span className="text-muted-foreground">Απόσταση:</span><span className="font-bold">{data.sprint_meters} m</span></div>}
                {data.sprint_seconds && <div className="flex justify-between"><span className="text-muted-foreground">Χρόνος:</span><span className="font-bold">{data.sprint_seconds} sec</span></div>}
                {data.sprint_watt && <div className="flex justify-between"><span className="text-muted-foreground">Watt:</span><span className="font-bold text-[#cb8954]">{data.sprint_watt}</span></div>}
                {data.sprint_resistance && <div className="flex justify-between"><span className="text-muted-foreground">Resistance:</span><span className="font-medium">{data.sprint_resistance}</span></div>}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const hasResults = masSessions.length > 0 || cardiacSessions.length > 0 || vo2Sessions.length > 0 || bodyweightSessions.length > 0 || farmerSessions.length > 0 || sprintSessions.length > 0;

  return (
    <div className="space-y-4">
      <CoachSearchInput value={searchTerm} onChange={setSearchTerm} />
      
      {!hasResults ? (
        <div className="text-center py-8 text-muted-foreground">Δεν βρέθηκαν αποτελέσματα</div>
      ) : (
        <div className="flex gap-6 overflow-x-auto pb-4">
          {masSessions.length > 0 && (
            <div className="flex-shrink-0 space-y-3">
              <h3 className="text-lg font-semibold border-b pb-2">MAS Tests</h3>
              <div className="space-y-3">{masSessions.map(s => renderCard(s, 'mas'))}</div>
            </div>
          )}
          {cardiacSessions.length > 0 && (
            <div className="flex-shrink-0 space-y-3">
              <h3 className="text-lg font-semibold border-b pb-2">Cardiac Data</h3>
              <div className="space-y-3">{cardiacSessions.map(s => renderCard(s, 'cardiac'))}</div>
            </div>
          )}
          {vo2Sessions.length > 0 && (
            <div className="flex-shrink-0 space-y-3">
              <h3 className="text-lg font-semibold border-b pb-2">VO2 Max</h3>
              <div className="space-y-3">{vo2Sessions.map(s => renderCard(s, 'vo2'))}</div>
            </div>
          )}
          {bodyweightSessions.length > 0 && (
            <div className="flex-shrink-0 space-y-3">
              <h3 className="text-lg font-semibold border-b pb-2">Bodyweight</h3>
              <div className="space-y-3">{bodyweightSessions.map(s => renderCard(s, 'bodyweight'))}</div>
            </div>
          )}
          {farmerSessions.length > 0 && (
            <div className="flex-shrink-0 space-y-3">
              <h3 className="text-lg font-semibold border-b pb-2">Farmer Test</h3>
              <div className="space-y-3">{farmerSessions.map(s => renderCard(s, 'farmer'))}</div>
            </div>
          )}
          {sprintSessions.length > 0 && (
            <div className="flex-shrink-0 space-y-3">
              <h3 className="text-lg font-semibold border-b pb-2">Sprint Test</h3>
              <div className="space-y-3">{sprintSessions.map(s => renderCard(s, 'sprint'))}</div>
            </div>
          )}
        </div>
      )}

      <DeleteConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Διαγραφή Καταγραφής"
        description="Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την καταγραφή;"
      />
    </div>
  );
};
