
import React, { useState, useEffect, useRef } from 'react';
import { Exercise, ProgramExercise } from '../types';
import { ExerciseSelectionDialog } from './ExerciseSelectionDialog';
import { ExerciseSelectionButton } from './ExerciseSelectionButton';
import { ExerciseDetailsForm } from './ExerciseDetailsForm';
import { useExerciseInputHandlers } from './hooks/useExerciseInputHandlers';
import { use1RMCalculation } from './hooks/use1RMCalculation';
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
  
  const initializedRef = useRef(false);
  
  const { oneRMData, hasData } = use1RMCalculation(selectedUserId, exercise.exercise_id);
  
  const { handleVelocityChange, handleKgChange, handlePercentageChange } = useExerciseInputHandlers({ 
    onUpdate,
    userId: selectedUserId,
    exerciseId: exercise.exercise_id
  });

  // Auto-populate fields όταν επιλέγεται άσκηση με 1RM
  useEffect(() => {
    if (!initializedRef.current && hasData && oneRMData && exercise.exercise_id) {
      const kgStr = (Number.isFinite(oneRMData.weight) ? oneRMData.weight : 0)
        .toFixed(1)
        .replace('.', ',');
      const velStr = (Number.isFinite(oneRMData.velocity) ? oneRMData.velocity : 0)
        .toFixed(2)
        .replace('.', ',');

      if (!exercise.percentage_1rm || exercise.percentage_1rm === 0) {
        onUpdate('percentage_1rm', 100);
      }
      if (!exercise.kg || exercise.kg === '') {
        onUpdate('kg', kgStr);
      }
      if (!exercise.velocity_ms) {
        onUpdate('velocity_ms', velStr);
      }

      initializedRef.current = true;
    }
  }, [hasData, oneRMData, exercise.exercise_id]);

  const handleExerciseSelect = (exerciseId: string) => {
    onUpdate('exercise_id', exerciseId);
    // επιτρέπουμε νέα αρχικοποίηση για την καινούρια άσκηση
    initializedRef.current = false;
    // Reset τα πεδία όταν αλλάζει η άσκηση
    onUpdate('percentage_1rm', '');
    onUpdate('kg', '');
    onUpdate('velocity_ms', '');
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
