import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { ExerciseSelector } from "./ExerciseSelector";
import { AttemptInput } from "./AttemptInput";
import { useToast } from "@/hooks/use-toast";
import { Exercise, Attempt, ExerciseTest } from "./types";

interface ExerciseTestCardProps {
  exerciseTest: ExerciseTest;
  exerciseIndex: number;
  exercises: Exercise[];
  onUpdate: (field: keyof ExerciseTest, value: any) => void;
  onRemove: () => void;
  onAddAttempt: () => void;
  onUpdateAttempt: (attemptIndex: number, field: keyof Attempt, value: any) => void;
  onRemoveAttempt: (attemptIndex: number) => void;
  onMark1RM: (attemptIndex: number) => void;
}

export const ExerciseTestCard = ({
  exerciseTest,
  exerciseIndex,
  exercises,
  onUpdate,
  onRemove,
  onAddAttempt,
  onUpdateAttempt,
  onRemoveAttempt,
  onMark1RM
}: ExerciseTestCardProps) => {
  const { toast } = useToast();

  const handleAddAttempt = () => {
    if (!exerciseTest.exercise_id) {
      toast({
        title: "Σφάλμα",
        description: "Παρακαλώ επιλέξτε άσκηση πρώτα",
        variant: "destructive"
      });
      return;
    }
    onAddAttempt();
  };

  return (
    <div className="p-3 border rounded-none bg-gray-50 w-full">
      <ExerciseSelector
        exercises={exercises}
        selectedExerciseId={exerciseTest.exercise_id}
        exerciseIndex={exerciseIndex}
        onExerciseSelect={(exerciseId) => onUpdate('exercise_id', exerciseId)}
        onRemove={onRemove}
      />

      <div className="mb-3">
        <Label className="text-sm">Ημερομηνία</Label>
        <Input
          type="date"
          value={exerciseTest.test_date}
          onChange={(e) => onUpdate('test_date', e.target.value)}
          className="rounded-none h-8 text-sm"
        />
      </div>

      <div className="mb-2">
        <Button
          size="sm"
          onClick={handleAddAttempt}
          className="rounded-none h-7 text-xs w-full"
        >
          <Plus className="w-3 h-3 mr-1" />
          Προσπάθεια
        </Button>
      </div>

      {exerciseTest.attempts.map((attempt, attemptIndex) => (
        <AttemptInput
          key={attemptIndex}
          attempt={attempt}
          onUpdate={(field, value) => onUpdateAttempt(attemptIndex, field, value)}
          onRemove={() => onRemoveAttempt(attemptIndex)}
          onMark1RM={() => onMark1RM(attemptIndex)}
        />
      ))}
    </div>
  );
};
