
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Exercise {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface Attempt {
  id?: string;
  attempt_number: number;
  weight_kg: number;
  velocity_ms: number;
  is_1rm: boolean;
  exercise_id?: string;
}

interface StrengthSession {
  id?: string;
  athlete_id: string;
  test_date: string;
  notes: string;
  attempts: Attempt[];
}

interface SessionWithDetails extends StrengthSession {
  app_users?: { name: string };
  attempts: (Attempt & { exercises?: { name: string } })[];
}

export const StrengthTestSession = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [sessions, setSessions] = useState<SessionWithDetails[]>([]);
  const [currentSession, setCurrentSession] = useState<StrengthSession>({
    athlete_id: '',
    test_date: new Date().toISOString().split('T')[0],
    notes: '',
    attempts: []
  });
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
    fetchExercises();
    fetchSessions();
  }, []);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('app_users')
      .select('id, name, email')
      .order('name');
    setUsers(data || []);
  };

  const fetchExercises = async () => {
    const { data } = await supabase
      .from('exercises')
      .select('id, name')
      .order('name');
    setExercises(data || []);
  };

  const fetchSessions = async () => {
    const { data: sessionsData } = await supabase
      .from('strength_test_sessions')
      .select(`
        *,
        app_users!athlete_id(name)
      `)
      .order('created_at', { ascending: false });

    if (sessionsData) {
      const sessionsWithAttempts = await Promise.all(
        sessionsData.map(async (session) => {
          const { data: attempts } = await supabase
            .from('strength_test_attempts')
            .select(`
              *,
              exercises(name)
            `)
            .eq('test_session_id', session.id)
            .order('attempt_number');

          return {
            ...session,
            attempts: attempts || []
          };
        })
      );
      setSessions(sessionsWithAttempts);
    }
  };

  const addAttempt = () => {
    if (!selectedExerciseId) {
      toast({
        title: "Σφάλμα",
        description: "Παρακαλώ επιλέξτε άσκηση",
        variant: "destructive"
      });
      return;
    }

    const newAttempt: Attempt = {
      attempt_number: currentSession.attempts.length + 1,
      weight_kg: 0,
      velocity_ms: 0,
      is_1rm: false,
      exercise_id: selectedExerciseId
    };
    setCurrentSession(prev => ({
      ...prev,
      attempts: [...prev.attempts, newAttempt]
    }));
  };

  const updateAttempt = (index: number, field: keyof Attempt, value: any) => {
    setCurrentSession(prev => ({
      ...prev,
      attempts: prev.attempts.map((attempt, i) => 
        i === index ? { ...attempt, [field]: value } : attempt
      )
    }));
  };

  const removeAttempt = (index: number) => {
    setCurrentSession(prev => ({
      ...prev,
      attempts: prev.attempts.filter((_, i) => i !== index)
        .map((attempt, i) => ({ ...attempt, attempt_number: i + 1 }))
    }));
  };

  const markAs1RM = (index: number) => {
    setCurrentSession(prev => ({
      ...prev,
      attempts: prev.attempts.map((attempt, i) => 
        ({ ...attempt, is_1rm: i === index })
      )
    }));
  };

  const saveSession = async () => {
    if (!currentSession.athlete_id || !selectedExerciseId || currentSession.attempts.length === 0) {
      toast({
        title: "Σφάλμα",
        description: "Παρακαλώ συμπληρώστε όλα τα απαραίτητα πεδία",
        variant: "destructive"
      });
      return;
    }

    try {
      let sessionId = currentSession.id;

      if (editingSessionId) {
        // Update existing session
        const { error: updateError } = await supabase
          .from('strength_test_sessions')
          .update({
            athlete_id: currentSession.athlete_id,
            test_date: currentSession.test_date,
            notes: currentSession.notes
          })
          .eq('id', editingSessionId);

        if (updateError) throw updateError;

        // Delete existing attempts
        await supabase
          .from('strength_test_attempts')
          .delete()
          .eq('test_session_id', editingSessionId);

        sessionId = editingSessionId;
      } else {
        // Create new session
        const { data: sessionData, error: sessionError } = await supabase
          .from('strength_test_sessions')
          .insert({
            athlete_id: currentSession.athlete_id,
            test_date: currentSession.test_date,
            notes: currentSession.notes
          })
          .select()
          .single();

        if (sessionError) throw sessionError;
        sessionId = sessionData.id;
      }

      // Insert attempts
      const attemptsToInsert = currentSession.attempts.map(attempt => ({
        test_session_id: sessionId,
        exercise_id: selectedExerciseId,
        attempt_number: attempt.attempt_number,
        weight_kg: attempt.weight_kg,
        velocity_ms: attempt.velocity_ms,
        is_1rm: attempt.is_1rm
      }));

      const { error: attemptsError } = await supabase
        .from('strength_test_attempts')
        .insert(attemptsToInsert);

      if (attemptsError) throw attemptsError;

      toast({
        title: "Επιτυχία",
        description: "Το τεστ δύναμης αποθηκεύτηκε επιτυχώς"
      });

      resetForm();
      fetchSessions();
    } catch (error) {
      console.error('Error saving strength test:', error);
      toast({
        title: "Σφάλμα",
        description: "Σφάλμα κατά την αποθήκευση",
        variant: "destructive"
      });
    }
  };

  const editSession = (session: SessionWithDetails) => {
    setCurrentSession({
      id: session.id,
      athlete_id: session.athlete_id,
      test_date: session.test_date,
      notes: session.notes || '',
      attempts: session.attempts
    });
    if (session.attempts.length > 0) {
      setSelectedExerciseId(session.attempts[0].exercise_id || '');
    }
    setEditingSessionId(session.id || null);
  };

  const resetForm = () => {
    setCurrentSession({
      athlete_id: '',
      test_date: new Date().toISOString().split('T')[0],
      notes: '',
      attempts: []
    });
    setSelectedExerciseId('');
    setEditingSessionId(null);
  };

  const deleteSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('strength_test_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      toast({
        title: "Επιτυχία",
        description: "Το τεστ διαγράφηκε επιτυχώς"
      });

      fetchSessions();
    } catch (error) {
      console.error('Error deleting session:', error);
      toast({
        title: "Σφάλμα",
        description: "Σφάλμα κατά τη διαγραφή",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Φόρμα Νέου/Επεξεργασίας Τεστ */}
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle>
            {editingSessionId ? 'Επεξεργασία Τεστ Δύναμης' : 'Νέο Τεστ Δύναμης'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Αθλητής</Label>
              <Select 
                value={currentSession.athlete_id} 
                onValueChange={(value) => setCurrentSession(prev => ({...prev, athlete_id: value}))}
              >
                <SelectTrigger className="rounded-none">
                  <SelectValue placeholder="Επιλέξτε αθλητή" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Άσκηση</Label>
              <Select 
                value={selectedExerciseId} 
                onValueChange={setSelectedExerciseId}
              >
                <SelectTrigger className="rounded-none">
                  <SelectValue placeholder="Επιλέξτε άσκηση" />
                </SelectTrigger>
                <SelectContent>
                  {exercises.map(exercise => (
                    <SelectItem key={exercise.id} value={exercise.id}>
                      {exercise.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Ημερομηνία</Label>
              <Input
                type="date"
                value={currentSession.test_date}
                onChange={(e) => setCurrentSession(prev => ({...prev, test_date: e.target.value}))}
                className="rounded-none"
              />
            </div>
          </div>

          <div>
            <Label>Σημειώσεις</Label>
            <Textarea
              value={currentSession.notes}
              onChange={(e) => setCurrentSession(prev => ({...prev, notes: e.target.value}))}
              className="rounded-none"
              placeholder="Προαιρετικές σημειώσεις..."
            />
          </div>

          {/* Προσπάθειες */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <Label>Προσπάθειες</Label>
              <Button onClick={addAttempt} size="sm" className="rounded-none">
                <Plus className="w-4 h-4 mr-1" />
                Προσπάθεια
              </Button>
            </div>

            {currentSession.attempts.map((attempt, index) => (
              <div key={index} className="flex items-center gap-2 mb-2 p-2 border rounded">
                <span className="min-w-[80px] text-sm">#{attempt.attempt_number}</span>
                
                <div className="flex-1">
                  <Input
                    type="number"
                    step="0.5"
                    placeholder="Κιλά (kg)"
                    value={attempt.weight_kg || ''}
                    onChange={(e) => updateAttempt(index, 'weight_kg', parseFloat(e.target.value) || 0)}
                    className="rounded-none text-sm h-8"
                  />
                </div>

                <div className="flex-1">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Ταχύτητα (m/s)"
                    value={attempt.velocity_ms || ''}
                    onChange={(e) => updateAttempt(index, 'velocity_ms', parseFloat(e.target.value) || 0)}
                    className="rounded-none text-sm h-8"
                  />
                </div>

                <Button
                  size="sm"
                  variant={attempt.is_1rm ? "default" : "outline"}
                  onClick={() => markAs1RM(index)}
                  className="rounded-none text-xs px-2"
                >
                  1RM
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => removeAttempt(index)}
                  className="rounded-none"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button onClick={saveSession} className="rounded-none">
              {editingSessionId ? 'Ενημέρωση' : 'Αποθήκευση'}
            </Button>
            {editingSessionId && (
              <Button variant="outline" onClick={resetForm} className="rounded-none">
                Ακύρωση
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Λίστα Υπαρχόντων Τεστ */}
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle>Υπάρχοντα Τεστ Δύναμης</CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              Δεν υπάρχουν τεστ δύναμης
            </p>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => {
                const oneRMAttempt = session.attempts.find((attempt: any) => attempt.is_1rm);
                const exerciseName = session.attempts[0]?.exercises?.name || 'Άγνωστη άσκηση';
                return (
                  <div key={session.id} className="border rounded p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">
                          {session.app_users?.name} - {exerciseName}
                        </h4>
                        <p className="text-sm text-gray-600">
                          Ημερομηνία: {new Date(session.test_date).toLocaleDateString('el-GR')}
                        </p>
                        <p className="text-sm text-gray-600">
                          Προσπάθειες: {session.attempts.length}
                        </p>
                        {oneRMAttempt && (
                          <div className="mt-1">
                            <Badge variant="outline" className="rounded-none">
                              1RM: {oneRMAttempt.weight_kg}kg @ {oneRMAttempt.velocity_ms}m/s
                            </Badge>
                          </div>
                        )}
                        {session.notes && (
                          <p className="text-xs text-gray-500 mt-1">{session.notes}</p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => editSession(session)}
                          className="rounded-none text-xs"
                        >
                          Επεξεργασία
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteSession(session.id!)}
                          className="rounded-none text-xs"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
