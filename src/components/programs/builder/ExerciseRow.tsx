
import React, { useState, useEffect, useCallback } from 'react';
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
  const { getOneRM, getVelocityForPercentage, loading: cacheLoading } = useUserExerciseDataCacheContext();

  // Get 1RM from cache (no individual DB query!)
  const oneRM = exercise.exercise_id ? getOneRM(exercise.exercise_id) : null;

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
    if (cacheLoading) return;
    
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
  }, [oneRM, cacheLoading, exercise.percentage_1rm, selectedUserId]);

  // Auto-calculate velocity from %1RM using load-velocity profile
  useEffect(() => {
    if (!exercise.percentage_1rm || !oneRM || !exercise.exercise_id) return;
    
    const percentage = parseFloat(exercise.percentage_1rm.toString().replace(',', '.'));
    if (isNaN(percentage) || percentage <= 0) return;

    const predictedVelocity = getVelocityForPercentage(exercise.exercise_id, percentage, oneRM);
    if (predictedVelocity !== null) {
      onUpdate('velocity_ms', predictedVelocity.toString().replace('.', ','));
    }
  }, [exercise.percentage_1rm, oneRM, exercise.exercise_id, getVelocityForPercentage]);

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
