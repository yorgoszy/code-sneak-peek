
import { useState } from 'react';

interface ExerciseProgress {
  [exerciseId: string]: number; // πόσα σετ έχουν ολοκληρωθεί
}

export const useExerciseCompletion = () => {
  const [exerciseProgress, setExerciseProgress] = useState<ExerciseProgress>({});

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

  return {
    completeSet,
    resetExercise,
    getProgress,
    isExerciseComplete,
    getRemainingText
  };
};
