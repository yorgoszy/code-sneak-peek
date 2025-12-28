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

      // Fetch sessions with data
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
            pull_ups
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

  // Group by type
  const masSessions = useMemo(() => sessions.filter(s => s.coach_endurance_test_data?.[0]?.mas_meters), [sessions]);
  const cardiacSessions = useMemo(() => sessions.filter(s => s.coach_endurance_test_data?.[0]?.max_hr || s.coach_endurance_test_data?.[0]?.resting_hr_1min), [sessions]);
  const vo2Sessions = useMemo(() => sessions.filter(s => s.coach_endurance_test_data?.[0]?.vo2_max), [sessions]);

  if (loading) return <div className="text-center py-8 text-muted-foreground">Φόρτωση...</div>;
  if (sessions.length === 0) return <div className="text-center py-8 text-muted-foreground">Δεν υπάρχουν καταγραφές</div>;

  const renderCard = (session: any) => {
    const data = session.coach_endurance_test_data?.[0];
    if (!data) return null;

    return (
      <Card key={session.id} className="rounded-none min-w-[200px]">
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
            {data.mas_meters && (
              <>
                <div className="flex justify-between"><span className="text-muted-foreground">Απόσταση:</span><span className="font-medium">{data.mas_meters}m</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Χρόνος:</span><span className="font-medium">{data.mas_minutes}'</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">MAS:</span><span className="font-bold text-[#cb8954]">{data.mas_ms?.toFixed(2)} m/s</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">MAS:</span><span className="font-bold text-[#cb8954]">{data.mas_kmh?.toFixed(2)} km/h</span></div>
              </>
            )}
            {data.max_hr && <div className="flex justify-between col-span-2"><span className="text-muted-foreground">Max HR:</span><span className="font-bold text-red-500">{data.max_hr} bpm</span></div>}
            {data.resting_hr_1min && <div className="flex justify-between col-span-2"><span className="text-muted-foreground">Resting HR:</span><span className="font-bold text-blue-500">{data.resting_hr_1min} bpm</span></div>}
            {data.vo2_max && <div className="flex justify-between col-span-2"><span className="text-muted-foreground">VO2 Max:</span><span className="font-bold text-[#cb8954]">{data.vo2_max}</span></div>}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {masSessions.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2">MAS Tests</h3>
          <div className="flex gap-2 overflow-x-auto pb-2">{masSessions.map(renderCard)}</div>
        </div>
      )}
      {cardiacSessions.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2">Cardiac Data</h3>
          <div className="flex gap-2 overflow-x-auto pb-2">{cardiacSessions.map(renderCard)}</div>
        </div>
      )}
      {vo2Sessions.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2">VO2 Max</h3>
          <div className="flex gap-2 overflow-x-auto pb-2">{vo2Sessions.map(renderCard)}</div>
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
