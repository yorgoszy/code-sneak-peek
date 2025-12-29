import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DeleteConfirmDialog } from "@/components/progress/DeleteConfirmDialog";
import { LoadVelocityChart } from "@/components/charts/LoadVelocityChart";
import { CoachSearchInput } from "./CoachSearchInput";

// Remove Greek accents for search
const removeAccents = (str: string): string => {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
};

interface CoachStrengthHistoryTabProps {
  coachId: string;
}

export const CoachStrengthHistoryTab: React.FC<CoachStrengthHistoryTabProps> = ({ coachId }) => {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersMap, setUsersMap] = useState<Map<string, { name: string; email: string }>>(new Map());
  const [exercisesMap, setExercisesMap] = useState<Map<string, string>>(new Map());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (coachId) fetchData();
  }, [coachId]);

  const fetchData = async () => {
    try {
      const [usersRes, exercisesRes, sessionsRes] = await Promise.all([
        supabase.from('coach_users').select('id, name, email').eq('coach_id', coachId),
        supabase.from('exercises').select('id, name'),
        supabase.from('coach_strength_test_sessions').select(`
          id, coach_user_id, test_date, notes, created_at,
          coach_strength_test_data (id, exercise_id, weight_kg, velocity_ms, is_1rm)
        `).eq('coach_id', coachId).order('created_at', { ascending: false })
      ]);

      const userMap = new Map<string, { name: string; email: string }>();
      (usersRes.data || []).forEach(u => userMap.set(u.id, { name: u.name, email: u.email }));
      setUsersMap(userMap);

      const exMap = new Map<string, string>();
      (exercisesRes.data || []).forEach(e => exMap.set(e.id, e.name));
      setExercisesMap(exMap);

      setSessions(sessionsRes.data || []);
    } catch (error) {
      console.error('Error fetching:', error);
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
      await supabase.from('coach_strength_test_data').delete().eq('test_session_id', sessionToDelete);
      await supabase.from('coach_strength_test_sessions').delete().eq('id', sessionToDelete);
      toast({ title: "Επιτυχία", description: "Η καταγραφή διαγράφηκε" });
      fetchData();
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
      const user = usersMap.get(session.coach_user_id);
      if (!user) return false;
      const nameMatch = removeAccents(user.name || '').includes(searchLower);
      const emailMatch = removeAccents(user.email || '').includes(searchLower);
      return nameMatch || emailMatch;
    });
  }, [sessions, searchTerm, usersMap]);

  // Group by exercise
  const sessionsByExercise = useMemo(() => {
    const grouped = new Map<string, { exerciseName: string; sessions: any[] }>();
    
    filteredSessions.forEach(session => {
      (session.coach_strength_test_data || []).forEach((data: any) => {
        const exId = data.exercise_id;
        const exName = exercisesMap.get(exId) || 'Άγνωστη';
        
        if (!grouped.has(exId)) {
          grouped.set(exId, { exerciseName: exName, sessions: [] });
        }
        
        const existing = grouped.get(exId)!.sessions.find(s => s.id === session.id);
        if (!existing) {
          grouped.get(exId)!.sessions.push({ ...session, attempts: [data] });
        } else {
          existing.attempts.push(data);
        }
      });
    });
    
    const priorityOrder = ['BP', 'SQ', 'Deadlift Trapbar', 'DL'];
    
    return Array.from(grouped.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => {
        const aIndex = priorityOrder.findIndex(name => a.exerciseName.toLowerCase().includes(name.toLowerCase()));
        const bIndex = priorityOrder.findIndex(name => b.exerciseName.toLowerCase().includes(name.toLowerCase()));
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        return a.exerciseName.localeCompare(b.exerciseName);
      });
  }, [filteredSessions, exercisesMap]);

  if (loading) return <div className="text-center py-8 text-muted-foreground">Φόρτωση...</div>;
  if (sessions.length === 0) return <div className="text-center py-8 text-muted-foreground">Δεν υπάρχουν καταγραφές</div>;

  return (
    <div className="space-y-4">
      <CoachSearchInput value={searchTerm} onChange={setSearchTerm} />
      
      {filteredSessions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">Δεν βρέθηκαν αποτελέσματα</div>
      ) : (
        <div className="flex gap-6 overflow-x-auto pb-4">
          {sessionsByExercise.map((group) => {
            const chartData = group.sessions.flatMap(session => 
              session.attempts
                .filter((a: any) => a.velocity_ms)
                .map((a: any) => ({
                  exerciseName: group.exerciseName,
                  velocity: a.velocity_ms,
                  weight: a.weight_kg,
                  date: session.test_date
                }))
            );

            return (
              <div key={group.id} className="flex-shrink-0 space-y-3">
                <h3 className="text-lg font-semibold border-b pb-2">{group.exerciseName}</h3>
                
                {chartData.length > 0 && (
                  <div className="w-[400px]">
                    <LoadVelocityChart data={chartData} selectedExercises={[group.exerciseName]} />
                  </div>
                )}
                
                <div className="space-y-3">
                  {group.sessions.map((session) => (
                    <Card key={session.id} className="rounded-none min-w-[220px]">
                      <CardContent className="p-2 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-semibold text-xs">{usersMap.get(session.coach_user_id)?.name || 'Άγνωστος'}</span>
                            <span className="text-[10px] text-muted-foreground ml-2">{format(new Date(session.test_date), 'dd/MM/yy')}</span>
                          </div>
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteClick(session.id)} className="h-6 w-6 p-0">
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </Button>
                        </div>
                        <div className="space-y-0.5">
                          <div className="grid grid-cols-[auto_1fr_1fr] gap-1 text-[10px] font-medium text-muted-foreground">
                            <span className="w-4">#</span><span>kg</span><span>m/s</span>
                          </div>
                          {session.attempts.map((a: any, i: number) => (
                            <div key={i} className="grid grid-cols-[auto_1fr_1fr] gap-1 text-[10px]">
                              <span className="w-4 text-muted-foreground">{i + 1}</span>
                              <span className="font-bold">{a.weight_kg}</span>
                              <span className="font-bold text-[#cb8954]">{a.velocity_ms?.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <DeleteConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Διαγραφή Καταγραφής"
        description="Είστε σίγουροι;"
      />
    </div>
  );
};
