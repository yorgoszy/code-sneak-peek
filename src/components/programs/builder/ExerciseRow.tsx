
import React, { useState } from 'react';
import { Exercise, ProgramExercise } from '../types';
import { ExerciseSelectionDialog } from './ExerciseSelectionDialog';
import { ExerciseSelectionButton } from './ExerciseSelectionButton';
import { ExerciseDetailsForm } from './ExerciseDetailsForm';
import { useExerciseInputHandlers } from './hooks/useExerciseInputHandlers';
import { calculateExerciseNumber } from './utils/exerciseNumberCalculator';

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
  
  const { handleVelocityChange, handleKgChange, handlePercentageChange } = useExerciseInputHandlers({ 
    onUpdate,
    userId: selectedUserId,
    exerciseId: exercise.exercise_id
  });

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
