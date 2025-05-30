import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { ExerciseTestCard } from "./ExerciseTestCard";
import { Exercise, Attempt, ExerciseTest, StrengthSession } from "./types";

interface SessionFormProps {
  session: StrengthSession;
  exercises: Exercise[];
  editingSessionId: string | null;
  onUpdateSession: (field: keyof StrengthSession, value: any) => void;
  onAddExerciseTest: () => void;
  onUpdateExerciseTest: (index: number, field: keyof ExerciseTest, value: any) => void;
  onRemoveExerciseTest: (index: number) => void;
  onAddAttempt: (exerciseIndex: number) => void;
  onUpdateAttempt: (exerciseIndex: number, attemptIndex: number, field: keyof Attempt, value: any) => void;
  onRemoveAttempt: (exerciseIndex: number, attemptIndex: number) => void;
  onMark1RM: (exerciseIndex: number, attemptIndex: number) => void;
  onSave: () => void;
  onReset: () => void;
}

export const SessionForm = ({
  session,
  exercises,
  editingSessionId,
  onUpdateSession,
  onAddExerciseTest,
  onUpdateExerciseTest,
  onRemoveExerciseTest,
  onAddAttempt,
  onUpdateAttempt,
  onRemoveAttempt,
  onMark1RM,
  onSave,
  onReset
}: SessionFormProps) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Σημειώσεις</Label>
          <Textarea
            value={session.notes}
            onChange={(e) => onUpdateSession('notes', e.target.value)}
            className="rounded-none"
            placeholder="Προαιρετικές σημειώσεις..."
          />
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-3">
          <Label>Ασκήσεις Τεστ</Label>
          <Button onClick={onAddExerciseTest} size="sm" className="rounded-none">
            <Plus className="w-4 h-4 mr-1" />
            Άσκηση
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {session.exercise_tests.map((exerciseTest, exerciseIndex) => (
            <ExerciseTestCard
              key={exerciseIndex}
              exerciseTest={exerciseTest}
              exerciseIndex={exerciseIndex}
              exercises={exercises}
              onUpdate={(field, value) => onUpdateExerciseTest(exerciseIndex, field, value)}
              onRemove={() => onRemoveExerciseTest(exerciseIndex)}
              onAddAttempt={() => onAddAttempt(exerciseIndex)}
              onUpdateAttempt={(attemptIndex, field, value) => onUpdateAttempt(exerciseIndex, attemptIndex, field, value)}
              onRemoveAttempt={(attemptIndex) => onRemoveAttempt(exerciseIndex, attemptIndex)}
              onMark1RM={(attemptIndex) => onMark1RM(exerciseIndex, attemptIndex)}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={onSave} className="rounded-none">
          {editingSessionId ? 'Ενημέρωση' : 'Αποθήκευση'}
        </Button>
        {editingSessionId && (
          <Button variant="outline" onClick={onReset} className="rounded-none">
            Ακύρωση
          </Button>
        )}
      </div>
    </div>
  );
};
