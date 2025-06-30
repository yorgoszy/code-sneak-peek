
import { useState, useCallback } from 'react';

interface ExerciseAdjustments {
  kg?: string;
  velocity?: string;
  reps?: string;
}

interface ExerciseState {
  completedSets: number;
  notes: string;
  adjustments: ExerciseAdjustments;
}

export const useExerciseCompletion = () => {
  const [exerciseStates, setExerciseStates] = useState<Record<string, ExerciseState>>({});

  const getExerciseState = useCallback((exerciseId: string): ExerciseState => {
    return exerciseStates[exerciseId] || {
      completedSets: 0,
      notes: '',
      adjustments: {}
    };
  }, [exerciseStates]);

  const updateExerciseState = useCallback((exerciseId: string, updates: Partial<ExerciseState>) => {
    setExerciseStates(prev => ({
      ...prev,
      [exerciseId]: {
        ...getExerciseState(exerciseId),
        ...updates
      }
    }));
  }, [getExerciseState]);

  const completeSet = useCallback((exerciseId: string, totalSets: number) => {
    const currentState = getExerciseState(exerciseId);
    const newCompletedSets = Math.min(currentState.completedSets + 1, totalSets);
    
    updateExerciseState(exerciseId, { completedSets: newCompletedSets });
    
    console.log(`✅ Set completed for exercise ${exerciseId}: ${newCompletedSets}/${totalSets}`);
  }, [getExerciseState, updateExerciseState]);

  const getRemainingText = useCallback((exerciseId: string) => {
    const currentState = getExerciseState(exerciseId);
    // We can't calculate remaining without knowing total sets, so just show completion status
    return currentState.completedSets > 0 ? ' ✅' : '';
  }, [getExerciseState]);

  const isExerciseComplete = useCallback((exerciseId: string, totalSets: number) => {
    const currentState = getExerciseState(exerciseId);
    return currentState.completedSets >= totalSets;
  }, [getExerciseState]);

  const updateNotes = useCallback((exerciseId: string, notes: string) => {
    console.log(`📝 Updating notes for ${exerciseId}:`, notes);
    updateExerciseState(exerciseId, { notes });
  }, [updateExerciseState]);

  const clearNotes = useCallback((exerciseId: string) => {
    console.log(`🗑️ Clearing notes for ${exerciseId}`);
    updateExerciseState(exerciseId, { notes: '' });
  }, [updateExerciseState]);

  const getNotes = useCallback((exerciseId: string) => {
    const state = getExerciseState(exerciseId);
    return state.notes;
  }, [getExerciseState]);

  const updateKg = useCallback((exerciseId: string, kg: string) => {
    console.log(`⚖️ Updating kg for ${exerciseId}:`, kg);
    const currentState = getExerciseState(exerciseId);
    updateExerciseState(exerciseId, {
      adjustments: { ...currentState.adjustments, kg }
    });
  }, [getExerciseState, updateExerciseState]);

  const clearKg = useCallback((exerciseId: string) => {
    console.log(`🗑️ Clearing kg for ${exerciseId}`);
    const currentState = getExerciseState(exerciseId);
    const { kg, ...restAdjustments } = currentState.adjustments;
    updateExerciseState(exerciseId, {
      adjustments: restAdjustments
    });
  }, [getExerciseState, updateExerciseState]);

  const updateVelocity = useCallback((exerciseId: string, velocity: string) => {
    console.log(`🏃 Updating velocity for ${exerciseId}:`, velocity);
    const currentState = getExerciseState(exerciseId);
    updateExerciseState(exerciseId, {
      adjustments: { ...currentState.adjustments, velocity }
    });
  }, [getExerciseState, updateExerciseState]);

  const clearVelocity = useCallback((exerciseId: string) => {
    console.log(`🗑️ Clearing velocity for ${exerciseId}`);
    const currentState = getExerciseState(exerciseId);
    const { velocity, ...restAdjustments } = currentState.adjustments;
    updateExerciseState(exerciseId, {
      adjustments: restAdjustments
    });
  }, [getExerciseState, updateExerciseState]);

  const updateReps = useCallback((exerciseId: string, reps: string) => {
    console.log(`🔢 Updating reps for ${exerciseId}:`, reps);
    const currentState = getExerciseState(exerciseId);
    updateExerciseState(exerciseId, {
      adjustments: { ...currentState.adjustments, reps }
    });
  }, [getExerciseState, updateExerciseState]);

  const clearReps = useCallback((exerciseId: string) => {
    console.log(`🗑️ Clearing reps for ${exerciseId}`);
    const currentState = getExerciseState(exerciseId);
    const { reps, ...restAdjustments } = currentState.adjustments;
    updateExerciseState(exerciseId, {
      adjustments: restAdjustments
    });
  }, [getExerciseState, updateExerciseState]);

  const getAdjustments = useCallback((exerciseId: string) => {
    const state = getExerciseState(exerciseId);
    return state.adjustments;
  }, [getExerciseState]);

  return {
    completeSet,
    getRemainingText,
    isExerciseComplete,
    updateNotes,
    clearNotes,
    getNotes,
    updateKg,
    clearKg,
    updateVelocity,
    clearVelocity,
    updateReps,
    clearReps,
    getAdjustments
  };
};
