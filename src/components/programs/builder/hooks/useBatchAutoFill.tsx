
import { useEffect, useRef } from 'react';
import { useUserExerciseDataCacheContext } from '@/hooks/useUserExerciseDataCache';
import type { ProgramStructure, Week } from './useProgramBuilderState';

/**
 * Batch auto-fill: when user exercise data finishes loading,
 * iterate ALL exercises ONCE and update kg/velocity in a single state update.
 * This replaces per-ExerciseRow useEffects that caused cascading re-renders.
 */
export const useBatchAutoFill = (
  updateProgram: (updates: Partial<ProgramStructure> | ((prev: ProgramStructure) => Partial<ProgramStructure>)) => void
) => {
  const { getOneRM, getVelocityForPercentage, loading, userId } = useUserExerciseDataCacheContext();
  const lastProcessedUserId = useRef<string | null>(null);
  const lastLoadingState = useRef<boolean>(true);

  useEffect(() => {
    // Only run when loading transitions from true to false (data just loaded)
    if (loading) {
      lastLoadingState.current = true;
      return;
    }

    // If we already processed this user, skip
    if (!lastLoadingState.current && lastProcessedUserId.current === userId) {
      return;
    }

    lastLoadingState.current = false;
    lastProcessedUserId.current = userId;

    // If no user selected, clear all auto-filled data
    if (!userId) {
      updateProgram((prev) => ({
        weeks: clearAllAutoFillData(prev.weeks)
      }));
      return;
    }

    // Batch update all exercises with 1RM/velocity data
    updateProgram((prev) => ({
      weeks: batchFillWeeks(prev.weeks, getOneRM, getVelocityForPercentage)
    }));
  }, [loading, userId, getOneRM, getVelocityForPercentage, updateProgram]);
};

function clearAllAutoFillData(weeks: Week[]): Week[] {
  let changed = false;
  const newWeeks = weeks.map(week => ({
    ...week,
    program_days: week.program_days.map(day => ({
      ...day,
      program_blocks: day.program_blocks.map(block => ({
        ...block,
        program_exercises: block.program_exercises.map(ex => {
          const hasPercentage = ex.percentage_1rm && 
            parseFloat(ex.percentage_1rm.toString().replace(',', '.')) > 0;
          
          if (hasPercentage) {
            // Clear auto-calculated kg and velocity
            changed = true;
            return { ...ex, kg: '', velocity_ms: 0 };
          }
          // Also clear kg that was auto-filled from direct 1RM (only if it looks like a number)
          if (ex.kg && !hasPercentage) {
            changed = true;
            return { ...ex, kg: '' };
          }
          return ex;
        })
      }))
    }))
  }));
  return changed ? newWeeks : weeks;
}

function batchFillWeeks(
  weeks: Week[],
  getOneRM: (exerciseId: string) => number | null,
  getVelocityForPercentage: (exerciseId: string, percentage: number, oneRM: number) => number | null
): Week[] {
  let changed = false;
  
  const newWeeks = weeks.map(week => ({
    ...week,
    program_days: week.program_days.map(day => ({
      ...day,
      program_blocks: day.program_blocks.map(block => ({
        ...block,
        program_exercises: block.program_exercises.map(ex => {
          if (!ex.exercise_id) return ex;

          const oneRM = getOneRM(ex.exercise_id);
          if (!oneRM) return ex;

          const hasPercentage = ex.percentage_1rm && 
            parseFloat(ex.percentage_1rm.toString().replace(',', '.')) > 0;

          let newKg = ex.kg;
          let newVelocity = ex.velocity_ms;

          if (hasPercentage) {
            // Calculate kg from %1RM
            const percentage = parseFloat(ex.percentage_1rm!.toString().replace(',', '.'));
            const calculatedKg = (oneRM * percentage) / 100;
            let roundedWeight = Math.round(calculatedKg);
            if (roundedWeight % 2 !== 0) {
              const lower = roundedWeight - 1;
              const upper = roundedWeight + 1;
              roundedWeight = Math.abs(calculatedKg - lower) < Math.abs(calculatedKg - upper) ? lower : upper;
            }
            newKg = roundedWeight.toString().replace('.', ',');

            // Calculate velocity from %1RM
            const predictedVelocity = getVelocityForPercentage(ex.exercise_id, percentage, oneRM);
            if (predictedVelocity !== null) {
              newVelocity = predictedVelocity;
            }
          } else if (!ex.kg) {
            // No percentage, no kg => fill with 1RM directly
            newKg = oneRM.toString().replace('.', ',');
          }

          if (newKg !== ex.kg || newVelocity !== ex.velocity_ms) {
            changed = true;
            return { ...ex, kg: newKg, velocity_ms: newVelocity };
          }
          return ex;
        })
      }))
    }))
  }));

  return changed ? newWeeks : weeks;
}
