import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DeleteConfirmDialog } from "@/components/progress/DeleteConfirmDialog";

interface CoachFunctionalHistoryTabProps {
  coachId: string;
}

export const CoachFunctionalHistoryTab: React.FC<CoachFunctionalHistoryTabProps> = ({ coachId }) => {
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
        supabase.from('coach_functional_test_sessions').select(`
          id, coach_user_id, test_date, notes, created_at,
          coach_functional_test_data (id, fms_score, fms_detailed_scores, posture_issues, squat_issues, single_leg_squat_issues)
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
      await supabase.from('coach_functional_test_data').delete().eq('test_session_id', sessionToDelete);
      await supabase.from('coach_functional_test_sessions').delete().eq('id', sessionToDelete);
      toast({ title: "Επιτυχία", description: "Διαγράφηκε" });
      fetchSessions();
    } catch (error) {
      toast({ title: "Σφάλμα", description: "Αποτυχία διαγραφής", variant: "destructive" });
    } finally {
      setDeleteDialogOpen(false);
      setSessionToDelete(null);
    }
  };

  if (loading) return <div className="text-center py-8 text-muted-foreground">Φόρτωση...</div>;
  if (sessions.length === 0) return <div className="text-center py-8 text-muted-foreground">Δεν υπάρχουν καταγραφές</div>;

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {sessions.map(session => {
        const data = session.coach_functional_test_data?.[0];
        if (!data) return null;

        return (
          <Card key={session.id} className="rounded-none min-w-[220px]">
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
              <div className="space-y-1 text-[10px]">
                {data.fms_score !== null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">FMS Score:</span>
                    <span className="font-bold text-[#cb8954]">{data.fms_score}</span>
                  </div>
                )}
                {data.posture_issues?.length > 0 && (
                  <div>
                    <span className="text-muted-foreground">Posture:</span>
                    <span className="ml-1 text-[9px]">{data.posture_issues.slice(0, 2).join(', ')}{data.posture_issues.length > 2 ? '...' : ''}</span>
                  </div>
                )}
                {data.squat_issues?.length > 0 && (
                  <div>
                    <span className="text-muted-foreground">Squat:</span>
                    <span className="ml-1 text-[9px]">{data.squat_issues.slice(0, 2).join(', ')}{data.squat_issues.length > 2 ? '...' : ''}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}

      <DeleteConfirmDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} onConfirm={handleDeleteConfirm} title="Διαγραφή" description="Είστε σίγουροι;" />
    </div>
  );
};
