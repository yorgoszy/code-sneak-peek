
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

interface ExerciseTest {
  id?: string;
  exercise_id: string;
  attempts: Attempt[];
}

interface Attempt {
  id?: string;
  attempt_number: number;
  weight_kg: number;
  velocity_ms: number;
  is_1rm: boolean;
}

interface StrengthSession {
  id?: string;
  athlete_id: string;
  test_date: string;
  notes: string;
  exercise_tests: ExerciseTest[];
}

interface SessionWithDetails extends StrengthSession {
  app_users?: { name: string };
  exercise_tests: (ExerciseTest & { 
    exercise_name?: string;
    attempts: (Attempt & { exercises?: { name: string } })[];
  })[];
}

interface StrengthTestSessionProps {
  selectedAthleteId: string;
}

export const StrengthTestSession = ({ selectedAthleteId }: StrengthTestSessionProps) => {
  const { toast } = useToast();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [sessions, setSessions] = useState<SessionWithDetails[]>([]);
  const [currentSession, setCurrentSession] = useState<StrengthSession>({
    athlete_id: selectedAthleteId,
    test_date: new Date().toISOString().split('T')[0],
    notes: '',
    exercise_tests: []
  });
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);

  useEffect(() => {
    setCurrentSession(prev => ({ ...prev, athlete_id: selectedAthleteId }));
    fetchExercises();
    fetchSessions();
  }, [selectedAthleteId]);

  const fetchExercises = async () => {
    const { data } = await supabase
      .from('exercises')
      .select('id, name')
      .order('name');
    setExercises(data || []);
  };

  const fetchSessions = async () => {
    if (!selectedAthleteId) return;

    const { data: sessionsData } = await supabase
      .from('strength_test_sessions')
      .select(`
        *,
        app_users!athlete_id(name)
      `)
      .eq('athlete_id', selectedAthleteId)
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
            .order('exercise_id, attempt_number');

          // Ομαδοποίηση προσπαθειών ανά άσκηση
          const exerciseTests: any[] = [];
          const exerciseMap = new Map();

          attempts?.forEach((attempt) => {
            const exerciseId = attempt.exercise_id;
            if (!exerciseMap.has(exerciseId)) {
              exerciseMap.set(exerciseId, {
                exercise_id: exerciseId,
                exercise_name: attempt.exercises?.name,
                attempts: []
              });
              exerciseTests.push(exerciseMap.get(exerciseId));
            }
            exerciseMap.get(exerciseId).attempts.push(attempt);
          });

          return {
            ...session,
            exercise_tests: exerciseTests
          };
        })
      );
      setSessions(sessionsWithAttempts);
    }
  };

  const addExerciseTest = () => {
    const newExerciseTest: ExerciseTest = {
      exercise_id: '',
      attempts: []
    };
    setCurrentSession(prev => ({
      ...prev,
      exercise_tests: [...prev.exercise_tests, newExerciseTest]
    }));
  };

  const updateExerciseTest = (index: number, field: keyof ExerciseTest, value: any) => {
    setCurrentSession(prev => ({
      ...prev,
      exercise_tests: prev.exercise_tests.map((test, i) => 
        i === index ? { ...test, [field]: value } : test
      )
    }));
  };

  const removeExerciseTest = (index: number) => {
    setCurrentSession(prev => ({
      ...prev,
      exercise_tests: prev.exercise_tests.filter((_, i) => i !== index)
    }));
  };

  const addAttempt = (exerciseIndex: number) => {
    const exerciseTest = currentSession.exercise_tests[exerciseIndex];
    if (!exerciseTest.exercise_id) {
      toast({
        title: "Σφάλμα",
        description: "Παρακαλώ επιλέξτε άσκηση πρώτα",
        variant: "destructive"
      });
      return;
    }

    const newAttempt: Attempt = {
      attempt_number: exerciseTest.attempts.length + 1,
      weight_kg: 0,
      velocity_ms: 0,
      is_1rm: false
    };

    updateExerciseTest(exerciseIndex, 'attempts', [...exerciseTest.attempts, newAttempt]);
  };

  const updateAttempt = (exerciseIndex: number, attemptIndex: number, field: keyof Attempt, value: any) => {
    const exerciseTest = currentSession.exercise_tests[exerciseIndex];
    const updatedAttempts = exerciseTest.attempts.map((attempt, i) => 
      i === attemptIndex ? { ...attempt, [field]: value } : attempt
    );
    updateExerciseTest(exerciseIndex, 'attempts', updatedAttempts);
  };

  const removeAttempt = (exerciseIndex: number, attemptIndex: number) => {
    const exerciseTest = currentSession.exercise_tests[exerciseIndex];
    const updatedAttempts = exerciseTest.attempts
      .filter((_, i) => i !== attemptIndex)
      .map((attempt, i) => ({ ...attempt, attempt_number: i + 1 }));
    updateExerciseTest(exerciseIndex, 'attempts', updatedAttempts);
  };

  const markAs1RM = (exerciseIndex: number, attemptIndex: number) => {
    const exerciseTest = currentSession.exercise_tests[exerciseIndex];
    const updatedAttempts = exerciseTest.attempts.map((attempt, i) => 
      ({ ...attempt, is_1rm: i === attemptIndex })
    );
    updateExerciseTest(exerciseIndex, 'attempts', updatedAttempts);
  };

  const saveSession = async () => {
    if (!currentSession.athlete_id || currentSession.exercise_tests.length === 0) {
      toast({
        title: "Σφάλμα",
        description: "Παρακαλώ προσθέστε τουλάχιστον μία άσκηση",
        variant: "destructive"
      });
      return;
    }

    // Έλεγχος ότι όλες οι ασκήσεις έχουν επιλεγεί και έχουν προσπάθειες
    for (const exerciseTest of currentSession.exercise_tests) {
      if (!exerciseTest.exercise_id || exerciseTest.attempts.length === 0) {
        toast({
          title: "Σφάλμα",
          description: "Όλες οι ασκήσεις πρέπει να έχουν επιλεγεί και να έχουν τουλάχιστον μία προσπάθεια",
          variant: "destructive"
        });
        return;
      }
    }

    try {
      let sessionId = currentSession.id;

      if (editingSessionId) {
        // Ενημέρωση υπάρχουσας συνεδρίας
        const { error: updateError } = await supabase
          .from('strength_test_sessions')
          .update({
            athlete_id: currentSession.athlete_id,
            test_date: currentSession.test_date,
            notes: currentSession.notes
          })
          .eq('id', editingSessionId);

        if (updateError) throw updateError;

        // Διαγραφή υπαρχουσών προσπαθειών
        await supabase
          .from('strength_test_attempts')
          .delete()
          .eq('test_session_id', editingSessionId);

        sessionId = editingSessionId;
      } else {
        // Δημιουργία νέας συνεδρίας
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

      // Εισαγωγή όλων των προσπαθειών
      const allAttempts: any[] = [];
      currentSession.exercise_tests.forEach(exerciseTest => {
        exerciseTest.attempts.forEach(attempt => {
          allAttempts.push({
            test_session_id: sessionId,
            exercise_id: exerciseTest.exercise_id,
            attempt_number: attempt.attempt_number,
            weight_kg: attempt.weight_kg,
            velocity_ms: attempt.velocity_ms,
            is_1rm: attempt.is_1rm
          });
        });
      });

      const { error: attemptsError } = await supabase
        .from('strength_test_attempts')
        .insert(allAttempts);

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
      exercise_tests: session.exercise_tests.map(et => ({
        exercise_id: et.exercise_id,
        attempts: et.attempts
      }))
    });
    setEditingSessionId(session.id || null);
  };

  const resetForm = () => {
    setCurrentSession({
      athlete_id: selectedAthleteId,
      test_date: new Date().toISOString().split('T')[0],
      notes: '',
      exercise_tests: []
    });
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Ημερομηνία</Label>
              <Input
                type="date"
                value={currentSession.test_date}
                onChange={(e) => setCurrentSession(prev => ({...prev, test_date: e.target.value}))}
                className="rounded-none"
              />
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
          </div>

          {/* Ασκήσεις και Προσπάθειες */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <Label>Ασκήσεις Τεστ</Label>
              <Button onClick={addExerciseTest} size="sm" className="rounded-none">
                <Plus className="w-4 h-4 mr-1" />
                Άσκηση
              </Button>
            </div>

            {currentSession.exercise_tests.map((exerciseTest, exerciseIndex) => (
              <Card key={exerciseIndex} className="mb-4 rounded-none">
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 mr-4">
                      <Label>Άσκηση {exerciseIndex + 1}</Label>
                      <Select 
                        value={exerciseTest.exercise_id} 
                        onValueChange={(value) => updateExerciseTest(exerciseIndex, 'exercise_id', value)}
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
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => addAttempt(exerciseIndex)}
                        className="rounded-none"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Προσπάθεια
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeExerciseTest(exerciseIndex)}
                        className="rounded-none"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {exerciseTest.attempts.map((attempt, attemptIndex) => (
                    <div key={attemptIndex} className="flex items-center gap-2 mb-2 p-2 border rounded">
                      <span className="min-w-[80px] text-sm">#{attempt.attempt_number}</span>
                      
                      <div className="flex-1">
                        <Input
                          type="number"
                          step="0.5"
                          placeholder="Κιλά (kg)"
                          value={attempt.weight_kg || ''}
                          onChange={(e) => updateAttempt(exerciseIndex, attemptIndex, 'weight_kg', parseFloat(e.target.value) || 0)}
                          className="rounded-none text-sm h-8"
                        />
                      </div>

                      <div className="flex-1">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Ταχύτητα (m/s)"
                          value={attempt.velocity_ms || ''}
                          onChange={(e) => updateAttempt(exerciseIndex, attemptIndex, 'velocity_ms', parseFloat(e.target.value) || 0)}
                          className="rounded-none text-sm h-8"
                        />
                      </div>

                      <Button
                        size="sm"
                        variant={attempt.is_1rm ? "default" : "outline"}
                        onClick={() => markAs1RM(exerciseIndex, attemptIndex)}
                        className="rounded-none text-xs px-2"
                      >
                        1RM
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeAttempt(exerciseIndex, attemptIndex)}
                        className="rounded-none"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
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
              Δεν υπάρχουν τεστ δύναμης για αυτόν τον αθλητή
            </p>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div key={session.id} className="border rounded p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">
                        Τεστ Δύναμης - {new Date(session.test_date).toLocaleDateString('el-GR')}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Ασκήσεις: {session.exercise_tests.length}
                      </p>
                      {session.exercise_tests.map((exerciseTest, index) => {
                        const oneRMAttempt = exerciseTest.attempts.find(attempt => attempt.is_1rm);
                        return (
                          <div key={index} className="mt-1">
                            <p className="text-sm font-medium">{exerciseTest.exercise_name}</p>
                            <p className="text-xs text-gray-500">
                              Προσπάθειες: {exerciseTest.attempts.length}
                            </p>
                            {oneRMAttempt && (
                              <Badge variant="outline" className="rounded-none text-xs">
                                1RM: {oneRMAttempt.weight_kg}kg @ {oneRMAttempt.velocity_ms}m/s
                              </Badge>
                            )}
                          </div>
                        );
                      })}
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
