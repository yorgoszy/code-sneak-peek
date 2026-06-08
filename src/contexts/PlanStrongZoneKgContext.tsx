import React, { createContext, useContext } from 'react';

interface Ctx {
  kgOptionsByExerciseId: Record<string, number[]>;
}

const PlanStrongZoneKgContext = createContext<Ctx>({ kgOptionsByExerciseId: {} });

export const PlanStrongZoneKgProvider: React.FC<{
  kgOptionsByExerciseId: Record<string, number[]>;
  children: React.ReactNode;
}> = ({ kgOptionsByExerciseId, children }) => (
  <PlanStrongZoneKgContext.Provider value={{ kgOptionsByExerciseId }}>
    {children}
  </PlanStrongZoneKgContext.Provider>
);

export const useZoneKgOptions = (exerciseId?: string): number[] | null => {
  const { kgOptionsByExerciseId } = useContext(PlanStrongZoneKgContext);
  if (!exerciseId) return null;
  const arr = kgOptionsByExerciseId[exerciseId];
  if (!arr || arr.length === 0) return null;
  // dedupe + sort ascending, keep only >0
  const uniq = Array.from(new Set(arr.filter(n => n > 0))).sort((a, b) => a - b);
  return uniq.length > 0 ? uniq : null;
};
