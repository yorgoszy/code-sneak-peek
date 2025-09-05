
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { StrengthSession, SessionWithDetails } from "./types";

export const useStrengthSessionManager = (
  selectedAthleteId: string, 
  selectedDate: string,
  onSessionsUpdate: () => void,
  onExercisesUpdate: () => void
) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [currentSession, setCurrentSession] = useState<StrengthSession>({
    user_id: selectedAthleteId,
    start_date: selectedDate,
    end_date: selectedDate,
    notes: '',
    exercise_tests: []
  });
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);

const saveSession = async () => {
    if (!currentSession.user_id || currentSession.exercise_tests.length === 0) {
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

    if (!user) {
      toast({
        title: "Σφάλμα",
        description: "Πρέπει να είστε συνδεδεμένοι για να αποθηκεύσετε δεδομένα",
        variant: "destructive"
      });
      return;
    }

    try {
      const testDates = currentSession.exercise_tests.map(et => et.test_date);
      const startDate = testDates.reduce((min, date) => date < min ? date : min);

      let sessionId = currentSession.id;

      if (editingSessionId) {
        // Update existing test_session
        const { error: updateError } = await supabase
          .from('test_sessions')
          .update({
            test_date: startDate,
            notes: currentSession.notes
          })
          .eq('id', editingSessionId);

        if (updateError) throw updateError;

        // Delete existing strength test data
        await supabase
          .from('strength_test_data')
          .delete()
          .eq('test_session_id', editingSessionId);

        sessionId = editingSessionId;
      } else {
        // Create new test_session
        const { data: sessionData, error: sessionError } = await supabase
          .from('test_sessions')
          .insert({
            user_id: currentSession.user_id,
            test_date: startDate,
            notes: currentSession.notes,
            test_types: ['strength']
          })
          .select()
          .single();

        if (sessionError) throw sessionError;
        sessionId = sessionData.id;
      }

      // Insert strength test data
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
        .from('strength_test_data')
        .insert(allAttempts);

      if (attemptsError) throw attemptsError;

      toast({
        title: "Επιτυχία",
        description: "Το τεστ δύναμης αποθηκεύτηκε επιτυχώς"
      });

      resetForm();
      onSessionsUpdate();
      onExercisesUpdate();
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
        .from('test_sessions')
        .delete()
        .eq('id', sessionId);
      
      if (error) throw error;

      toast({
        title: "Επιτυχία",
        description: "Το τεστ διαγράφηκε επιτυχώς"
      });

      onSessionsUpdate();
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
      user_id: selectedAthleteId,
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
      user_id: session.user_id,
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
    currentSession,
    editingSessionId,
    setCurrentSession,
    saveSession,
    deleteSession,
    resetForm,
    editSession
  };
};
