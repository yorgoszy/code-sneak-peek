import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface Exercise {
  id: string;
  name: string;
  usage_count?: number;
}

interface Attempt {
  id?: string;
  attempt_number: number;
  weight_kg: number;
  velocity_ms: number;
  is_1rm: boolean;
  exercises?: { name: string };
}

interface ExerciseTest {
  id?: string;
  exercise_id: string;
  test_date: string;
  attempts: Attempt[];
}

interface StrengthSession {
  id?: string;
  athlete_id: string;
  start_date: string;
  end_date: string;
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

export const useStrengthTestData = (selectedAthleteId: string, selectedDate: string) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [sessions, setSessions] = useState<SessionWithDetails[]>([]);
  const [currentSession, setCurrentSession] = useState<StrengthSession>({
    athlete_id: selectedAthleteId,
    start_date: selectedDate,
    end_date: selectedDate,
    notes: '',
    exercise_tests: []
  });
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);

  useEffect(() => {
    setCurrentSession(prev => ({ 
      ...prev, 
      athlete_id: selectedAthleteId,
      start_date: selectedDate,
      end_date: selectedDate
    }));
    fetchExercises();
    fetchSessions();
  }, [selectedAthleteId, selectedDate]);

  // Δημιουργία app_user εάν δεν υπάρχει
  const ensureAppUserExists = async () => {
    if (!user) return null;

    const { data: existingAppUser, error: checkError } = await supabase
      .from('app_users')
      .select('id')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (existingAppUser) {
      return existingAppUser.id;
    }

    if (checkError) {
      console.error('Error checking app_user:', checkError);
    }

    const { data: newAppUser, error: createError } = await supabase
      .from('app_users')
      .insert({
        auth_user_id: user.id,
        email: user.email || 'unknown@email.com',
        name: user.user_metadata?.full_name || user.email || 'Unknown User',
        role: 'coach'
      })
      .select('id')
      .single();

    if (createError) {
      console.error('Error creating app_user:', createError);
      throw createError;
    }

    return newAppUser.id;
  };

  const fetchExercises = async () => {
    const { data: exercisesData } = await supabase
      .from('exercises')
      .select('id, name')
      .order('name');

    if (!exercisesData) {
      setExercises([]);
      return;
    }

    const { data: usageStats } = await supabase
      .from('strength_test_attempts')
      .select(`
        exercise_id,
        strength_test_sessions!inner(athlete_id)
      `)
      .eq('strength_test_sessions.athlete_id', selectedAthleteId);

    const usageMap = new Map();
    usageStats?.forEach(stat => {
      const count = usageMap.get(stat.exercise_id) || 0;
      usageMap.set(stat.exercise_id, count + 1);
    });

    const exercisesWithUsage = exercisesData.map(exercise => ({
      ...exercise,
      usage_count: usageMap.get(exercise.id) || 0
    }));

    exercisesWithUsage.sort((a, b) => {
      if (a.usage_count !== b.usage_count) {
        return b.usage_count - a.usage_count;
      }
      return a.name.localeCompare(b.name);
    });

    setExercises(exercisesWithUsage);
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

          const exerciseTests: any[] = [];
          const exerciseMap = new Map();

          attempts?.forEach((attempt) => {
            const exerciseId = attempt.exercise_id;
            if (!exerciseMap.has(exerciseId)) {
              exerciseMap.set(exerciseId, {
                exercise_id: exerciseId,
                exercise_name: attempt.exercises?.name,
                test_date: session.test_date,
                attempts: []
              });
              exerciseTests.push(exerciseMap.get(exerciseId));
            }
            exerciseMap.get(exerciseId).attempts.push(attempt);
          });

          return {
            ...session,
            start_date: session.test_date,
            end_date: session.test_date,
            exercise_tests: exerciseTests
          };
        })
      );
      setSessions(sessionsWithAttempts);
    }
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
      const appUserId = await ensureAppUserExists();
      
      if (!appUserId) {
        toast({
          title: "Σφάλμα",
          description: "Σφάλμα στη δημιουργία χρήστη",
          variant: "destructive"
        });
        return;
      }

      const testDates = currentSession.exercise_tests.map(et => et.test_date);
      const startDate = testDates.reduce((min, date) => date < min ? date : min);

      let sessionId = currentSession.id;

      if (editingSessionId) {
        const { error: updateError } = await supabase
          .from('strength_test_sessions')
          .update({
            athlete_id: currentSession.athlete_id,
            test_date: startDate,
            notes: currentSession.notes,
            created_by: appUserId
          })
          .eq('id', editingSessionId);

        if (updateError) throw updateError;

        await supabase
          .from('strength_test_attempts')
          .delete()
          .eq('test_session_id', editingSessionId);

        sessionId = editingSessionId;
      } else {
        const { data: sessionData, error: sessionError } = await supabase
          .from('strength_test_sessions')
          .insert({
            athlete_id: currentSession.athlete_id,
            test_date: startDate,
            notes: currentSession.notes,
            created_by: appUserId
          })
          .select()
          .single();

        if (sessionError) throw sessionError;
        sessionId = sessionData.id;
      }

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
      fetchExercises();
    } catch (error) {
      console.error('Error saving strength test:', error);
      toast({
        title: "Σφάλμα",
        description: "Σφάλμα κατά την αποθήκευση: " + (error as any).message,
        variant: "destructive"
      });
    }
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

  const resetForm = () => {
    setCurrentSession({
      athlete_id: selectedAthleteId,
      start_date: selectedDate,
      end_date: selectedDate,
      notes: '',
      exercise_tests: []
    });
    setEditingSessionId(null);
  };

  const editSession = (session: SessionWithDetails) => {
    setCurrentSession({
      id: session.id,
      athlete_id: session.athlete_id,
      start_date: session.start_date,
      end_date: session.end_date,
      notes: session.notes || '',
      exercise_tests: session.exercise_tests.map(et => ({
        exercise_id: et.exercise_id,
        test_date: et.test_date || session.start_date,
        attempts: et.attempts
      }))
    });
    setEditingSessionId(session.id || null);
  };

  return {
    exercises,
    sessions,
    currentSession,
    editingSessionId,
    setCurrentSession,
    saveSession,
    deleteSession,
    resetForm,
    editSession,
    fetchExercises,
    fetchSessions
  };
};
