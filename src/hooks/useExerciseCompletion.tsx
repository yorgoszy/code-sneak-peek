
import { useState } from 'react';

interface ExerciseProgress {
  [exerciseId: string]: number; // πόσα σετ έχουν ολοκληρωθεί
}

interface ExerciseNotes {
  [exerciseId: string]: string;
}

interface ExerciseAdjustments {
  [exerciseId: string]: {
    actualKg?: string;
    actualVelocity?: number;
  };
}

export const useExerciseCompletion = () => {
  const [exerciseProgress, setExerciseProgress] = useState<ExerciseProgress>({});
  const [exerciseNotes, setExerciseNotes] = useState<ExerciseNotes>({});
  const [exerciseAdjustments, setExerciseAdjustments] = useState<ExerciseAdjustments>({});

  const completeSet = (exerciseId: string, totalSets: number) => {
    setExerciseProgress(prev => {
      const currentProgress = prev[exerciseId] || 0;
      const newProgress = Math.min(currentProgress + 1, totalSets);
      
      return {
        ...prev,
        [exerciseId]: newProgress
      };
    });
  };

  const resetExercise = (exerciseId: string) => {
    setExerciseProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[exerciseId];
      return newProgress;
    });
  };

  const updateNotes = (exerciseId: string, notes: string) => {
    setExerciseNotes(prev => ({
      ...prev,
      [exerciseId]: notes
    }));
  };

  const clearNotes = (exerciseId: string) => {
    setExerciseNotes(prev => {
      const newNotes = { ...prev };
      delete newNotes[exerciseId];
      return newNotes;
    });
  };

  const updateKg = (exerciseId: string, kg: string) => {
    setExerciseAdjustments(prev => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        actualKg: kg
      }
    }));
  };

  const clearKg = (exerciseId: string) => {
    setExerciseAdjustments(prev => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        actualKg: undefined
      }
    }));
  };

  const updateVelocity = (exerciseId: string, velocity: number) => {
    setExerciseAdjustments(prev => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        actualVelocity: velocity
      }
    }));
  };

  const clearVelocity = (exerciseId: string) => {
    setExerciseAdjustments(prev => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        actualVelocity: undefined
      }
    }));
  };

  const getProgress = (exerciseId: string) => {
    return exerciseProgress[exerciseId] || 0;
  };

  const isExerciseComplete = (exerciseId: string, totalSets: number) => {
    return getProgress(exerciseId) >= totalSets;
  };

  const getRemainingText = (exerciseId: string, totalSets: number) => {
    const completed = getProgress(exerciseId);
    if (completed === 0) return '';
    
    const remaining = totalSets - completed;
    if (remaining <= 0) return ' ✓';
    return ` -${remaining}`;
  };

  const getNotes = (exerciseId: string) => {
    return exerciseNotes[exerciseId] || '';
  };

  const getAdjustments = (exerciseId: string) => {
    return exerciseAdjustments[exerciseId] || {};
  };

  return {
    completeSet,
    resetExercise,
    getProgress,
    isExerciseComplete,
    getRemainingText,
    updateNotes,
    clearNotes,
    getNotes,
    updateKg,
    clearKg,
    updateVelocity,
    clearVelocity,
    getAdjustments
  };
};
