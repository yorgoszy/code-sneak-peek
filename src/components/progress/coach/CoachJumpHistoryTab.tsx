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

interface CoachJumpHistoryTabProps {
  coachId: string;
}

export const CoachJumpHistoryTab: React.FC<CoachJumpHistoryTabProps> = ({ coachId }) => {
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
      const [usersRes, sessionsRes] = await Promise.all([
        supabase.from('app_users').select('id, name, email').eq('coach_id', coachId),
        supabase.from('coach_jump_test_sessions').select(`
          id, user_id, test_date, notes, created_at,
          coach_jump_test_data (id, counter_movement_jump, non_counter_movement_jump, depth_jump, broad_jump, triple_jump_left, triple_jump_right)
        `).eq('coach_id', coachId).order('created_at', { ascending: false })
      ]);

      const userMap = new Map<string, { name: string; email: string }>();
      (usersRes.data || []).forEach(u => userMap.set(u.id, { name: u.name, email: u.email }));
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

  // Group by test type
  const cmjSessions = useMemo(() => filteredSessions.filter(s => s.coach_jump_test_data?.[0]?.counter_movement_jump), [filteredSessions]);
  const nonCmjSessions = useMemo(() => filteredSessions.filter(s => s.coach_jump_test_data?.[0]?.non_counter_movement_jump), [filteredSessions]);
  const depthSessions = useMemo(() => filteredSessions.filter(s => s.coach_jump_test_data?.[0]?.depth_jump), [filteredSessions]);
  const broadSessions = useMemo(() => filteredSessions.filter(s => s.coach_jump_test_data?.[0]?.broad_jump), [filteredSessions]);
  const tripleSessions = useMemo(() => filteredSessions.filter(s => s.coach_jump_test_data?.[0]?.triple_jump_left || s.coach_jump_test_data?.[0]?.triple_jump_right), [filteredSessions]);

  if (loading) return <div className="text-center py-8 text-muted-foreground">Φόρτωση...</div>;
  if (sessions.length === 0) return <div className="text-center py-8 text-muted-foreground">Δεν υπάρχουν καταγραφές</div>;

  const renderCard = (session: any, valueKey: string, label: string) => {
    const data = session.coach_jump_test_data?.[0];
    if (!data) return null;
    
    return (
      <Card key={session.id} className="rounded-none min-w-[180px] shrink-0">
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

  const hasResults = cmjSessions.length > 0 || nonCmjSessions.length > 0 || depthSessions.length > 0 || broadSessions.length > 0 || tripleSessions.length > 0;

  return (
    <div className="space-y-4">
      <CoachSearchInput value={searchTerm} onChange={setSearchTerm} />
      
      {!hasResults ? (
        <div className="text-center py-8 text-muted-foreground">Δεν βρέθηκαν αποτελέσματα</div>
      ) : (
        <div className="flex gap-6 overflow-x-auto pb-4">
          {cmjSessions.length > 0 && (
            <div className="flex-shrink-0 space-y-3">
              <h3 className="text-lg font-semibold border-b pb-2">CMJ</h3>
              <div className="space-y-3">{cmjSessions.map(s => renderCard(s, 'counter_movement_jump', 'CMJ'))}</div>
            </div>
          )}
          {nonCmjSessions.length > 0 && (
            <div className="flex-shrink-0 space-y-3">
              <h3 className="text-lg font-semibold border-b pb-2">Non-CMJ</h3>
              <div className="space-y-3">{nonCmjSessions.map(s => renderCard(s, 'non_counter_movement_jump', 'Non-CMJ'))}</div>
            </div>
          )}
          {depthSessions.length > 0 && (
            <div className="flex-shrink-0 space-y-3">
              <h3 className="text-lg font-semibold border-b pb-2">Depth Jump</h3>
              <div className="space-y-3">{depthSessions.map(s => renderCard(s, 'depth_jump', 'Depth'))}</div>
            </div>
          )}
          {broadSessions.length > 0 && (
            <div className="flex-shrink-0 space-y-3">
              <h3 className="text-lg font-semibold border-b pb-2">Broad Jump</h3>
              <div className="space-y-3">{broadSessions.map(s => renderCard(s, 'broad_jump', 'Broad'))}</div>
            </div>
          )}
          {tripleSessions.length > 0 && (
            <div className="flex-shrink-0 space-y-3">
              <h3 className="text-lg font-semibold border-b pb-2">Triple Jump</h3>
              <div className="space-y-3">{tripleSessions.map(s => renderCard(s, 'triple', ''))}</div>
            </div>
          )}
        </div>
      )}

      <DeleteConfirmDialog isOpen={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} onConfirm={handleDeleteConfirm} title="Διαγραφή" description="Είστε σίγουροι;" />
    </div>
  );
};
