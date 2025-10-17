import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import { Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LoadVelocityChart } from "@/components/charts/LoadVelocityChart";

export const HistoryTab: React.FC = () => {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAttempt, setEditingAttempt] = useState<any>(null);
  const [editWeight, setEditWeight] = useState('');
  const [editVelocity, setEditVelocity] = useState('');

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('strength_test_sessions')
        .select(`
          id,
          test_date,
          notes,
          created_at,
          app_users!strength_test_sessions_user_id_fkey (
            id,
            name
          ),
          strength_test_attempts (
            id,
            weight_kg,
            velocity_ms,
            attempt_number,
            exercises (
              id,
              name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditAttempt = (attempt: any) => {
    setEditingAttempt(attempt);
    setEditWeight(attempt.weight_kg.toString());
    setEditVelocity(attempt.velocity_ms.toString());
  };

  const handleSaveEdit = async () => {
    if (!editingAttempt) return;

    const weight = parseFloat(editWeight);
    const velocity = parseFloat(editVelocity);

    if (isNaN(weight) || isNaN(velocity) || weight <= 0 || velocity <= 0) {
      toast({
        title: "Σφάλμα",
        description: "Παρακαλώ εισάγετε έγκυρες τιμές",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('strength_test_attempts')
        .update({
          weight_kg: weight,
          velocity_ms: velocity
        })
        .eq('id', editingAttempt.id);

      if (error) throw error;

      toast({
        title: "Επιτυχία",
        description: "Η προσπάθεια ενημερώθηκε"
      });

      setEditingAttempt(null);
      fetchSessions();
    } catch (error) {
      console.error('Error updating attempt:', error);
      toast({
        title: "Σφάλμα",
        description: "Αποτυχία ενημέρωσης",
        variant: "destructive"
      });
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την καταγραφή;')) {
      return;
    }

    try {
      // Delete attempts first (due to foreign key)
      const { error: attemptsError } = await supabase
        .from('strength_test_attempts')
        .delete()
        .eq('test_session_id', sessionId);

      if (attemptsError) throw attemptsError;

      // Delete session
      const { error: sessionError } = await supabase
        .from('strength_test_sessions')
        .delete()
        .eq('id', sessionId);

      if (sessionError) throw sessionError;

      toast({
        title: "Επιτυχία",
        description: "Η καταγραφή διαγράφηκε"
      });

      fetchSessions();
    } catch (error) {
      console.error('Error deleting session:', error);
      toast({
        title: "Σφάλμα",
        description: "Αποτυχία διαγραφής",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Φόρτωση...</div>;
  }

  if (sessions.length === 0) {
    return <div className="text-center py-8 text-gray-500">Δεν υπάρχουν καταγραφές</div>;
  }

  return (
    <>
      <div className="space-y-4">
        {sessions.map((session) => {
          // Group attempts by exercise
          const attemptsByExercise = session.strength_test_attempts.reduce((acc: any, attempt: any) => {
            const exerciseId = attempt.exercises?.id;
            if (!acc[exerciseId]) {
              acc[exerciseId] = {
                exerciseName: attempt.exercises?.name || 'Άγνωστη Άσκηση',
                attempts: []
              };
            }
            acc[exerciseId].attempts.push(attempt);
            return acc;
          }, {});

          return (
            <Card key={session.id} className="rounded-none">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-4">
                  <CardTitle className="text-base whitespace-nowrap">
                    {session.app_users?.name || 'Άγνωστος Χρήστης'}
                  </CardTitle>
                  <span className="text-sm text-gray-500">
                    {format(new Date(session.test_date), 'dd MMM yyyy', { locale: el })}
                  </span>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteSession(session.id)}
                    className="rounded-none ml-auto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {Object.values(attemptsByExercise).map((exerciseData: any, idx: number) => {
                  // Prepare chart data for this exercise
                  const chartData = exerciseData.attempts.map((attempt: any) => ({
                    exerciseName: exerciseData.exerciseName,
                    exerciseId: attempt.exercises?.id,
                    velocity: attempt.velocity_ms || 0,
                    weight: attempt.weight_kg,
                    date: session.test_date,
                    sessionId: session.id
                  }));

                  return (
                    <div key={idx} className="grid grid-cols-1 lg:grid-cols-[230px_1fr] gap-6">
                      {/* Left side - Attempts list */}
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">{exerciseData.exerciseName}</Label>
                        <div className="space-y-1">
                          {/* Header */}
                          <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-1 p-1 text-xs font-medium text-gray-600">
                            <span className="w-4">#</span>
                            <span>Κιλά</span>
                            <span>m/s</span>
                            <span className="w-6"></span>
                          </div>
                          {/* Attempts */}
                          {exerciseData.attempts
                            .sort((a: any, b: any) => a.attempt_number - b.attempt_number)
                            .map((attempt: any) => (
                              <div key={attempt.id} className="grid grid-cols-[auto_1fr_1fr_auto] gap-1 p-1 border rounded-none bg-white">
                                <span className="text-xs font-medium w-4">#{attempt.attempt_number}</span>
                                <span className="text-xs border rounded-none p-1 bg-gray-50">{attempt.weight_kg} kg</span>
                                <span className="text-xs border rounded-none p-1 bg-gray-50">{attempt.velocity_ms} m/s</span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditAttempt(attempt)}
                                  className="rounded-none h-6 w-6 p-0"
                                >
                                  <Pencil className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                        </div>
                      </div>

                      {/* Right side - Chart */}
                      <div className="flex items-center justify-center">
                        {chartData.length > 0 && (
                          <div className="w-full">
                            <LoadVelocityChart 
                              data={chartData}
                              selectedExercises={[exerciseData.exerciseName]}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!editingAttempt} onOpenChange={() => setEditingAttempt(null)}>
        <DialogContent className="rounded-none">
          <DialogHeader>
            <DialogTitle>Επεξεργασία Προσπάθειας</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Βάρος (kg)</Label>
              <Input
                type="number"
                step="0.5"
                value={editWeight}
                onChange={(e) => setEditWeight(e.target.value)}
                className="rounded-none"
              />
            </div>
            <div>
              <Label>Ταχύτητα (m/s)</Label>
              <Input
                type="number"
                step="0.01"
                value={editVelocity}
                onChange={(e) => setEditVelocity(e.target.value)}
                className="rounded-none"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSaveEdit}
                className="rounded-none flex-1"
              >
                Αποθήκευση
              </Button>
              <Button
                variant="outline"
                onClick={() => setEditingAttempt(null)}
                className="rounded-none flex-1"
              >
                Ακύρωση
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
