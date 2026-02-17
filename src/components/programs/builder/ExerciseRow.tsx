
import React, { useState, useEffect, useCallback, useRef } from 'react';
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

  // Refs to track last auto-filled values and prevent redundant updates
  const lastAutoFilledKg = useRef<string | null>(null);
  const lastAutoFilledVelocity = useRef<string | null>(null);
  const lastExerciseId = useRef<string | null>(null);

  // Reset refs when exercise changes
  if (exercise.exercise_id !== lastExerciseId.current) {
    lastExerciseId.current = exercise.exercise_id || null;
    lastAutoFilledKg.current = null;
    lastAutoFilledVelocity.current = null;
  }

  // Get 1RM from cache (no individual DB query!)
  const oneRM = exercise.exercise_id ? getOneRM(exercise.exercise_id) : null;

  // Auto-fill kg field with 1RM when exercise is selected and kg is empty
  useEffect(() => {
    if (cacheLoading) return;
    
    const hasPercentage = exercise.percentage_1rm && 
      parseFloat(exercise.percentage_1rm.toString().replace(',', '.')) > 0;
    
    if (oneRM && exercise.exercise_id && !exercise.kg && !hasPercentage) {
      const newKg = oneRM.toString().replace('.', ',');
      if (newKg !== lastAutoFilledKg.current) {
        lastAutoFilledKg.current = newKg;
        onUpdate('kg', newKg);
      }
    }
  }, [oneRM, exercise.exercise_id, cacheLoading]); // removed exercise.kg and exercise.percentage_1rm to prevent loops

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
          
          const newKg = roundedWeight.toString().replace('.', ',');
          if (newKg !== lastAutoFilledKg.current) {
            lastAutoFilledKg.current = newKg;
            onUpdate('kg', newKg);
          }
        }
      }
    }
  }, [oneRM, cacheLoading, exercise.percentage_1rm]);

  // Auto-calculate velocity from %1RM using load-velocity profile
  useEffect(() => {
    if (cacheLoading) return;
    if (!exercise.percentage_1rm || !oneRM || !exercise.exercise_id) return;
    
    const percentage = parseFloat(exercise.percentage_1rm.toString().replace(',', '.'));
    if (isNaN(percentage) || percentage <= 0) return;

    const predictedVelocity = getVelocityForPercentage(exercise.exercise_id, percentage, oneRM);
    if (predictedVelocity !== null) {
      const newVelocity = predictedVelocity.toString().replace('.', ',');
      if (newVelocity !== lastAutoFilledVelocity.current) {
        lastAutoFilledVelocity.current = newVelocity;
        onUpdate('velocity_ms', newVelocity);
      }
    }
  }, [exercise.percentage_1rm, oneRM, exercise.exercise_id, cacheLoading]);

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
