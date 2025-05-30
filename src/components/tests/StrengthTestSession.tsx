
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SessionForm } from "./strength/SessionForm";
import { SessionsList } from "./strength/SessionsList";
import { useStrengthTestData } from "./strength/useStrengthTestData";

interface StrengthTestSessionProps {
  selectedAthleteId: string;
  selectedDate: string;
}

export const StrengthTestSession = ({ selectedAthleteId, selectedDate }: StrengthTestSessionProps) => {
  const {
    exercises,
    sessions,
    currentSession,
    editingSessionId,
    setCurrentSession,
    saveSession,
    deleteSession,
    resetForm,
    editSession
  } = useStrengthTestData(selectedAthleteId, selectedDate);

  const addExerciseTest = () => {
    const newExerciseTest = {
      exercise_id: '',
      test_date: selectedDate,
      attempts: []
    };
    setCurrentSession(prev => ({
      ...prev,
      exercise_tests: [...prev.exercise_tests, newExerciseTest]
    }));
  };

  const updateExerciseTest = (index: number, field: string, value: any) => {
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
    const newAttempt = {
      attempt_number: exerciseTest.attempts.length + 1,
      weight_kg: 0,
      velocity_ms: 0,
      is_1rm: false
    };

    updateExerciseTest(exerciseIndex, 'attempts', [...exerciseTest.attempts, newAttempt]);
  };

  const updateAttempt = (exerciseIndex: number, attemptIndex: number, field: string, value: any) => {
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

  const updateSession = (field: string, value: any) => {
    setCurrentSession(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle>
            {editingSessionId ? 'Επεξεργασία Τεστ Δύναμης' : 'Νέο Τεστ Δύναμης'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SessionForm
            session={currentSession}
            exercises={exercises}
            editingSessionId={editingSessionId}
            onUpdateSession={updateSession}
            onAddExerciseTest={addExerciseTest}
            onUpdateExerciseTest={updateExerciseTest}
            onRemoveExerciseTest={removeExerciseTest}
            onAddAttempt={addAttempt}
            onUpdateAttempt={updateAttempt}
            onRemoveAttempt={removeAttempt}
            onMark1RM={markAs1RM}
            onSave={saveSession}
            onReset={resetForm}
          />
        </CardContent>
      </Card>

      <Card className="rounded-none">
        <CardHeader>
          <CardTitle>Υπάρχοντα Τεστ Δύναμης</CardTitle>
        </CardHeader>
        <CardContent>
          <SessionsList
            sessions={sessions}
            onEdit={editSession}
            onDelete={deleteSession}
          />
        </CardContent>
      </Card>
    </div>
  );
};
