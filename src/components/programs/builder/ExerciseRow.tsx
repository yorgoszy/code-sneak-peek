
import React, { useState, useEffect } from 'react';
import { Exercise, ProgramExercise } from '../types';
import { ExerciseSelectionDialog } from './ExerciseSelectionDialog';
import { ExerciseSelectionButton } from './ExerciseSelectionButton';
import { ExerciseDetailsForm } from './ExerciseDetailsForm';
import { useExerciseInputHandlers } from './hooks/useExerciseInputHandlers';
import { calculateExerciseNumber } from './utils/exerciseNumberCalculator';
import { useExercise1RM } from '@/hooks/useExercise1RM';

interface ExerciseRowProps {
  exercise: ProgramExercise;
  exercises: Exercise[];
  allBlockExercises: ProgramExercise[];
  selectedUserId?: string;
  onUpdate: (field: string, value: any) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onExercisesUpdate?: (exercises: Exercise[]) => void;
}

export const ExerciseRow: React.FC<ExerciseRowProps> = ({
  exercise,
  exercises,
  allBlockExercises,
  selectedUserId,
  onUpdate,
  onRemove,
  onDuplicate,
  onExercisesUpdate
}) => {
  const [showExerciseDialog, setShowExerciseDialog] = useState(false);
  
  const { handleVelocityChange, handleKgChange, handlePercentageChange } = useExerciseInputHandlers({ onUpdate });

  // Fetch 1RM for selected user and exercise
  const { oneRM } = useExercise1RM({
    userId: selectedUserId || null,
    exerciseId: exercise.exercise_id || null
  });

  console.log('🎯 ExerciseRow - selectedUserId:', selectedUserId, 'exercise_id:', exercise.exercise_id, 'oneRM:', oneRM, 'current kg:', exercise.kg);

  // Auto-fill kg field with 1RM when exercise is selected and kg is empty
  useEffect(() => {
    if (oneRM && exercise.exercise_id && !exercise.kg) {
      console.log('🏋️ Auto-filling 1RM:', oneRM, 'kg for exercise:', exercise.exercise_id);
      onUpdate('kg', oneRM.toString().replace('.', ','));
    }
  }, [oneRM, exercise.exercise_id, exercise.kg]);

  const handleExerciseSelect = (exerciseId: string) => {
    onUpdate('exercise_id', exerciseId);
    setShowExerciseDialog(false);
  };

  const selectedExercise = exercises.find(ex => ex.id === exercise.exercise_id);
  const exerciseNumber = calculateExerciseNumber(exercise, allBlockExercises);

  return (
    <>
      <div className="bg-white border-0 border-b w-full" style={{ fontSize: '12px' }}>
        <ExerciseSelectionButton
          selectedExercise={selectedExercise}
          exerciseNumber={exerciseNumber}
          onSelectExercise={() => setShowExerciseDialog(true)}
          onDuplicate={onDuplicate}
          onRemove={onRemove}
        />
        
        <ExerciseDetailsForm
          exercise={exercise}
          onUpdate={onUpdate}
          onVelocityChange={handleVelocityChange}
          onKgChange={handleKgChange}
          onPercentageChange={handlePercentageChange}
        />
      </div>

      <ExerciseSelectionDialog
        open={showExerciseDialog}
        onOpenChange={setShowExerciseDialog}
        exercises={exercises}
        onSelectExercise={handleExerciseSelect}
        onExercisesUpdate={onExercisesUpdate}
      />
    </>
  );
};
