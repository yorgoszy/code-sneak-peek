import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DeleteConfirmDialog } from "@/components/progress/DeleteConfirmDialog";

interface CoachJumpHistoryTabProps {
  coachId: string;
}

export const CoachJumpHistoryTab: React.FC<CoachJumpHistoryTabProps> = ({ coachId }) => {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersMap, setUsersMap] = useState<Map<string, string>>(new Map());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (coachId) fetchSessions();
  }, [coachId]);

  const fetchSessions = async () => {
    try {
      const [usersRes, sessionsRes] = await Promise.all([
        supabase.from('coach_users').select('id, name').eq('coach_id', coachId),
        supabase.from('coach_jump_test_sessions').select(`
          id, coach_user_id, test_date, notes, created_at,
          coach_jump_test_data (id, counter_movement_jump, non_counter_movement_jump, depth_jump, broad_jump, triple_jump_left, triple_jump_right)
        `).eq('coach_id', coachId).order('created_at', { ascending: false })
      ]);

      const userMap = new Map<string, string>();
      (usersRes.data || []).forEach(u => userMap.set(u.id, u.name));
      setUsersMap(userMap);
      setSessions(sessionsRes.data || []);
    } catch (error) {
      console.error('Error:', error);
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
      await supabase.from('coach_jump_test_data').delete().eq('test_session_id', sessionToDelete);
      await supabase.from('coach_jump_test_sessions').delete().eq('id', sessionToDelete);
      toast({ title: "Επιτυχία", description: "Διαγράφηκε" });
      fetchSessions();
    } catch (error) {
      toast({ title: "Σφάλμα", description: "Αποτυχία διαγραφής", variant: "destructive" });
    } finally {
      setDeleteDialogOpen(false);
      setSessionToDelete(null);
    }
  };

  // Group by test type
  const cmjSessions = useMemo(() => sessions.filter(s => s.coach_jump_test_data?.[0]?.counter_movement_jump), [sessions]);
  const nonCmjSessions = useMemo(() => sessions.filter(s => s.coach_jump_test_data?.[0]?.non_counter_movement_jump), [sessions]);
  const depthSessions = useMemo(() => sessions.filter(s => s.coach_jump_test_data?.[0]?.depth_jump), [sessions]);
  const broadSessions = useMemo(() => sessions.filter(s => s.coach_jump_test_data?.[0]?.broad_jump), [sessions]);
  const tripleSessions = useMemo(() => sessions.filter(s => s.coach_jump_test_data?.[0]?.triple_jump_left || s.coach_jump_test_data?.[0]?.triple_jump_right), [sessions]);

  if (loading) return <div className="text-center py-8 text-muted-foreground">Φόρτωση...</div>;
  if (sessions.length === 0) return <div className="text-center py-8 text-muted-foreground">Δεν υπάρχουν καταγραφές</div>;

  const renderCard = (session: any, valueKey: string, label: string) => {
    const data = session.coach_jump_test_data?.[0];
    if (!data) return null;
    
    return (
      <Card key={session.id} className="rounded-none min-w-[180px]">
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
          {valueKey === 'triple' ? (
            <div className="grid grid-cols-2 gap-1 text-[10px]">
              {data.triple_jump_left && <div className="flex justify-between"><span className="text-muted-foreground">Left:</span><span className="font-bold text-[#cb8954]">{data.triple_jump_left} cm</span></div>}
              {data.triple_jump_right && <div className="flex justify-between"><span className="text-muted-foreground">Right:</span><span className="font-bold text-[#cb8954]">{data.triple_jump_right} cm</span></div>}
            </div>
          ) : (
            <div className="text-[10px] flex justify-between">
              <span className="text-muted-foreground">{label}:</span>
              <span className="font-bold text-[#cb8954]">{data[valueKey]} cm</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {cmjSessions.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2">CMJ</h3>
          <div className="flex gap-2 overflow-x-auto pb-2">{cmjSessions.map(s => renderCard(s, 'counter_movement_jump', 'CMJ'))}</div>
        </div>
      )}
      {nonCmjSessions.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2">Non-CMJ</h3>
          <div className="flex gap-2 overflow-x-auto pb-2">{nonCmjSessions.map(s => renderCard(s, 'non_counter_movement_jump', 'Non-CMJ'))}</div>
        </div>
      )}
      {depthSessions.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2">Depth Jump</h3>
          <div className="flex gap-2 overflow-x-auto pb-2">{depthSessions.map(s => renderCard(s, 'depth_jump', 'Depth'))}</div>
        </div>
      )}
      {broadSessions.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2">Broad Jump</h3>
          <div className="flex gap-2 overflow-x-auto pb-2">{broadSessions.map(s => renderCard(s, 'broad_jump', 'Broad'))}</div>
        </div>
      )}
      {tripleSessions.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2">Triple Jump</h3>
          <div className="flex gap-2 overflow-x-auto pb-2">{tripleSessions.map(s => renderCard(s, 'triple', ''))}</div>
        </div>
      )}

      <DeleteConfirmDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} onConfirm={handleDeleteConfirm} title="Διαγραφή" description="Είστε σίγουροι;" />
    </div>
  );
};
