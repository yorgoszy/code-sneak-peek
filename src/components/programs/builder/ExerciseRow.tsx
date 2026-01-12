
import React, { useState, useEffect, useCallback } from 'react';
import { Exercise, ProgramExercise } from '../types';
import { ExerciseSelectionDialog } from './ExerciseSelectionDialog';
import { ExerciseSelectionButton } from './ExerciseSelectionButton';
import { ExerciseDetailsFormOptimized } from './ExerciseDetailsFormOptimized';
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

export const ExerciseRow: React.FC<ExerciseRowProps> = React.memo(({
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

  // Fetch 1RM for selected user and exercise
  const { oneRM, loading: oneRMLoading } = useExercise1RM({
    userId: selectedUserId || null,
    exerciseId: exercise.exercise_id || null
  });

  // Auto-fill kg field with 1RM when exercise is selected and kg is empty
  useEffect(() => {
    const hasPercentage = exercise.percentage_1rm && 
      parseFloat(exercise.percentage_1rm.toString().replace(',', '.')) > 0;
    
    if (oneRM && exercise.exercise_id && !exercise.kg && !hasPercentage) {
      onUpdate('kg', oneRM.toString().replace('.', ','));
    }
  }, [oneRM, exercise.exercise_id, exercise.kg, exercise.percentage_1rm]);

  // Auto-calculate kg based on %1RM
  useEffect(() => {
    if (oneRMLoading) return;
    
    if (exercise.percentage_1rm) {
      const percentage = parseFloat(exercise.percentage_1rm.toString().replace(',', '.'));
      if (!isNaN(percentage) && percentage > 0) {
        if (oneRM) {
          const calculatedKg = (oneRM * percentage) / 100;
          let roundedWeight = Math.round(calculatedKg);
          
          if (roundedWeight % 2 !== 0) {
            const lowerEven = roundedWeight - 1;
            const upperEven = roundedWeight + 1;
            if (Math.abs(calculatedKg - lowerEven) < Math.abs(calculatedKg - upperEven)) {
              roundedWeight = lowerEven;
            } else {
              roundedWeight = upperEven;
            }
          }
          
          onUpdate('kg', roundedWeight.toString().replace('.', ','));
        } else {
          onUpdate('kg', '');
        }
      }
    }
  }, [oneRM, oneRMLoading, exercise.percentage_1rm, selectedUserId]);

  const handleExerciseSelect = useCallback((exerciseId: string) => {
    onUpdate('exercise_id', exerciseId);
    setShowExerciseDialog(false);
  }, [onUpdate]);

  const selectedExercise = exercises.find(ex => ex.id === exercise.exercise_id);
  const exerciseNumber = calculateExerciseNumber(exercise, allBlockExercises);

  return (
    <>
      <div className="bg-white border-0 border-b w-full" style={{ fontSize: '12px' }}>
        <ExerciseSelectionButton
          selectedExercise={selectedExercise}
          exerciseNumber={exerciseNumber}
          allExercises={exercises}
          onSelectExercise={() => setShowExerciseDialog(true)}
          onDuplicate={onDuplicate}
          onRemove={onRemove}
          onReplaceExercise={(newExerciseId) => onUpdate('exercise_id', newExerciseId)}
        />
        
        <ExerciseDetailsFormOptimized
          exercise={exercise}
          onUpdate={onUpdate}
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
});

ExerciseRow.displayName = 'ExerciseRow';
