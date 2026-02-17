
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Exercise, ProgramExercise } from '../types';
import { ExerciseSelectionDialog } from './ExerciseSelectionDialog';
import { ExerciseSelectionButton } from './ExerciseSelectionButton';
import { ExerciseDetailsFormOptimized } from './ExerciseDetailsFormOptimized';
import { calculateExerciseNumber } from './utils/exerciseNumberCalculator';
import { useUserExerciseDataCacheContext } from '@/hooks/useUserExerciseDataCache';

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
  const { getOneRM, getVelocityForPercentage, userId } = useUserExerciseDataCacheContext();

  // Track last auto-filled values to avoid redundant updates
  const lastAutoKg = useRef<string>('');
  const lastAutoVelocity = useRef<number>(0);

  // Auto-calculate kg/velocity when %1RM or exercise_id changes
  const exerciseId = exercise.exercise_id;
  const percentage = exercise.percentage_1rm;
  const currentKg = exercise.kg;

  useEffect(() => {
    if (!userId || !exerciseId) return;

    const oneRM = getOneRM(exerciseId);
    if (!oneRM) return;

    const pct = percentage ? parseFloat(percentage.toString().replace(',', '.')) : 0;

    if (pct > 0) {
      // Calculate kg from %1RM
      const calculatedKg = (oneRM * pct) / 100;
      let roundedWeight = Math.round(calculatedKg);
      if (roundedWeight % 2 !== 0) {
        const lower = roundedWeight - 1;
        const upper = roundedWeight + 1;
        roundedWeight = Math.abs(calculatedKg - lower) < Math.abs(calculatedKg - upper) ? lower : upper;
      }
      const newKg = roundedWeight.toString().replace('.', ',');

      if (newKg !== lastAutoKg.current) {
        lastAutoKg.current = newKg;
        onUpdate('kg', newKg);
      }

      // Calculate velocity
      const predictedVelocity = getVelocityForPercentage(exerciseId, pct, oneRM);
      if (predictedVelocity !== null && predictedVelocity !== lastAutoVelocity.current) {
        lastAutoVelocity.current = predictedVelocity;
        onUpdate('velocity_ms', predictedVelocity);
      }
    } else if (!currentKg && !lastAutoKg.current) {
      // No percentage, no kg => fill with 1RM directly (only once)
      const rmStr = oneRM.toString().replace('.', ',');
      lastAutoKg.current = rmStr;
      onUpdate('kg', rmStr);
    }
  }, [exerciseId, percentage, userId]); // intentionally minimal deps

  const handleExerciseSelect = useCallback((exerciseId: string) => {
    // Reset auto-fill tracking for new exercise
    lastAutoKg.current = '';
    lastAutoVelocity.current = 0;
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
          onReplaceExercise={(newExerciseId) => {
            lastAutoKg.current = '';
            lastAutoVelocity.current = 0;
            onUpdate('exercise_id', newExerciseId);
          }}
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
