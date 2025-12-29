import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DeleteConfirmDialog } from "@/components/progress/DeleteConfirmDialog";

interface CoachEnduranceHistoryTabProps {
  coachId: string;
}

export const CoachEnduranceHistoryTab: React.FC<CoachEnduranceHistoryTabProps> = ({ coachId }) => {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersMap, setUsersMap] = useState<Map<string, string>>(new Map());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (coachId) {
      fetchSessions();
    }
  }, [coachId]);

  const fetchSessions = async () => {
    try {
      // Fetch coach users for name mapping
      const { data: coachUsers } = await supabase
        .from('coach_users')
        .select('id, name')
        .eq('coach_id', coachId);

      const userMap = new Map<string, string>();
      (coachUsers || []).forEach(u => userMap.set(u.id, u.name));
      setUsersMap(userMap);

      // Fetch sessions with ALL data fields
      const { data, error } = await supabase
        .from('coach_endurance_test_sessions')
        .select(`
          id,
          coach_user_id,
          test_date,
          notes,
          created_at,
          coach_endurance_test_data (
            id,
            mas_meters,
            mas_minutes,
            mas_ms,
            mas_kmh,
            vo2_max,
            max_hr,
            resting_hr_1min,
            push_ups,
            pull_ups,
            crunches,
            t2b,
            farmer_kg,
            farmer_meters,
            farmer_seconds,
            sprint_meters,
            sprint_seconds,
            sprint_watt,
            sprint_resistance
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
      const { error: dataError } = await supabase
        .from('coach_endurance_test_data')
        .delete()
        .eq('test_session_id', sessionToDelete);

      if (dataError) throw dataError;

      const { error: sessionError } = await supabase
        .from('coach_endurance_test_sessions')
        .delete()
        .eq('id', sessionToDelete);

      if (sessionError) throw sessionError;

      toast({ title: "Επιτυχία", description: "Η καταγραφή διαγράφηκε" });
      fetchSessions();
    } catch (error) {
      console.error('Error deleting:', error);
      toast({ title: "Σφάλμα", description: "Αποτυχία διαγραφής", variant: "destructive" });
    } finally {
      setDeleteDialogOpen(false);
      setSessionToDelete(null);
    }
  };

  // Group by type - matching the same order as record tab
  const masSessions = useMemo(() => 
    sessions.filter(s => s.coach_endurance_test_data?.[0]?.mas_meters), [sessions]);
  
  const cardiacSessions = useMemo(() => 
    sessions.filter(s => s.coach_endurance_test_data?.[0]?.max_hr || s.coach_endurance_test_data?.[0]?.resting_hr_1min), [sessions]);
  
  const vo2Sessions = useMemo(() => 
    sessions.filter(s => s.coach_endurance_test_data?.[0]?.vo2_max), [sessions]);
  
  // Bodyweight sessions - push_ups, pull_ups, crunches, t2b
  const bodyweightSessions = useMemo(() => 
    sessions.filter(s => {
      const data = s.coach_endurance_test_data?.[0];
      return data?.push_ups || data?.pull_ups || data?.crunches || data?.t2b;
    }), [sessions]);
  
  // Farmer sessions
  const farmerSessions = useMemo(() => 
    sessions.filter(s => s.coach_endurance_test_data?.[0]?.farmer_kg), [sessions]);
  
  // Sprint sessions
  const sprintSessions = useMemo(() => 
    sessions.filter(s => s.coach_endurance_test_data?.[0]?.sprint_meters || s.coach_endurance_test_data?.[0]?.sprint_seconds), [sessions]);

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
              <span className="font-semibold text-xs">{usersMap.get(session.coach_user_id) || 'Άγνωστος'}</span>
              <span className="text-[10px] text-muted-foreground ml-2">{format(new Date(session.test_date), 'dd/MM/yy')}</span>
            </div>
            <Button size="sm" variant="ghost" onClick={() => handleDeleteClick(session.id)} className="h-6 w-6 p-0">
              <Trash2 className="w-3 h-3 text-destructive" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-1 text-[10px]">
            {/* MAS Data */}
            {type === 'mas' && data.mas_meters && (
              <>
                <div className="flex justify-between"><span className="text-muted-foreground">Απόσταση:</span><span className="font-medium">{data.mas_meters}m</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Χρόνος:</span><span className="font-medium">{data.mas_minutes}'</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">MAS:</span><span className="font-bold text-[#cb8954]">{data.mas_ms?.toFixed(2)} m/s</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">MAS:</span><span className="font-bold text-[#cb8954]">{data.mas_kmh?.toFixed(2)} km/h</span></div>
              </>
            )}
            
            {/* Cardiac Data */}
            {type === 'cardiac' && (
              <>
                {data.max_hr && <div className="flex justify-between col-span-2"><span className="text-muted-foreground">Max HR:</span><span className="font-bold text-red-500">{data.max_hr} bpm</span></div>}
                {data.resting_hr_1min && <div className="flex justify-between col-span-2"><span className="text-muted-foreground">Resting HR:</span><span className="font-bold text-blue-500">{data.resting_hr_1min} bpm</span></div>}
              </>
            )}
            
            {/* VO2 Max */}
            {type === 'vo2' && data.vo2_max && (
              <div className="flex justify-between col-span-2"><span className="text-muted-foreground">VO2 Max:</span><span className="font-bold text-[#cb8954]">{data.vo2_max}</span></div>
            )}
            
            {/* Bodyweight Data */}
            {type === 'bodyweight' && (
              <>
                {data.push_ups && <div className="flex justify-between"><span className="text-muted-foreground">Push Ups:</span><span className="font-bold">{data.push_ups}</span></div>}
                {data.pull_ups && <div className="flex justify-between"><span className="text-muted-foreground">Pull Ups:</span><span className="font-bold">{data.pull_ups}</span></div>}
                {data.crunches && <div className="flex justify-between"><span className="text-muted-foreground">Crunches:</span><span className="font-bold">{data.crunches}</span></div>}
                {data.t2b && <div className="flex justify-between"><span className="text-muted-foreground">T2B:</span><span className="font-bold">{data.t2b}</span></div>}
              </>
            )}
            
            {/* Farmer Data */}
            {type === 'farmer' && (
              <>
                {data.farmer_kg && <div className="flex justify-between"><span className="text-muted-foreground">Βάρος:</span><span className="font-bold">{data.farmer_kg} kg</span></div>}
                {data.farmer_meters && <div className="flex justify-between"><span className="text-muted-foreground">Απόσταση:</span><span className="font-bold">{data.farmer_meters} m</span></div>}
                {data.farmer_seconds && <div className="flex justify-between"><span className="text-muted-foreground">Χρόνος:</span><span className="font-bold">{data.farmer_seconds} sec</span></div>}
              </>
            )}
            
            {/* Sprint Data */}
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

  return (
    <div className="flex gap-6 overflow-x-auto pb-4">
      {/* MAS Tests */}
      {masSessions.length > 0 && (
        <div className="flex-shrink-0 space-y-3">
          <h3 className="text-lg font-semibold border-b pb-2">MAS Tests</h3>
          <div className="space-y-3">
            {masSessions.map(s => renderCard(s, 'mas'))}
          </div>
        </div>
      )}
      
      {/* Cardiac Data */}
      {cardiacSessions.length > 0 && (
        <div className="flex-shrink-0 space-y-3">
          <h3 className="text-lg font-semibold border-b pb-2">Cardiac Data</h3>
          <div className="space-y-3">
            {cardiacSessions.map(s => renderCard(s, 'cardiac'))}
          </div>
        </div>
      )}
      
      {/* VO2 Max */}
      {vo2Sessions.length > 0 && (
        <div className="flex-shrink-0 space-y-3">
          <h3 className="text-lg font-semibold border-b pb-2">VO2 Max</h3>
          <div className="space-y-3">
            {vo2Sessions.map(s => renderCard(s, 'vo2'))}
          </div>
        </div>
      )}
      
      {/* Bodyweight */}
      {bodyweightSessions.length > 0 && (
        <div className="flex-shrink-0 space-y-3">
          <h3 className="text-lg font-semibold border-b pb-2">Bodyweight</h3>
          <div className="space-y-3">
            {bodyweightSessions.map(s => renderCard(s, 'bodyweight'))}
          </div>
        </div>
      )}
      
      {/* Farmer */}
      {farmerSessions.length > 0 && (
        <div className="flex-shrink-0 space-y-3">
          <h3 className="text-lg font-semibold border-b pb-2">Farmer Test</h3>
          <div className="space-y-3">
            {farmerSessions.map(s => renderCard(s, 'farmer'))}
          </div>
        </div>
      )}
      
      {/* Sprint */}
      {sprintSessions.length > 0 && (
        <div className="flex-shrink-0 space-y-3">
          <h3 className="text-lg font-semibold border-b pb-2">Sprint Test</h3>
          <div className="space-y-3">
            {sprintSessions.map(s => renderCard(s, 'sprint'))}
          </div>
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
