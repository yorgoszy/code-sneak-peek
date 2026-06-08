import React, { createContext, useContext, useMemo } from 'react';

export interface ZoneKgMeta {
  kg: number;
  percentage: number; // e.g. 75 for 75% 1RM
}

interface Ctx {
  zoneMetaByExerciseId: Record<string, ZoneKgMeta[]>;
}

const PlanStrongZoneKgContext = createContext<Ctx>({ zoneMetaByExerciseId: {} });

export const PlanStrongZoneKgProvider: React.FC<{
  zoneMetaByExerciseId: Record<string, ZoneKgMeta[]>;
  children: React.ReactNode;
}> = ({ zoneMetaByExerciseId, children }) => {
  const value = useMemo(() => ({ zoneMetaByExerciseId }), [zoneMetaByExerciseId]);
  return (
    <PlanStrongZoneKgContext.Provider value={value}>
      {children}
    </PlanStrongZoneKgContext.Provider>
  );
};

export const useZoneKgMeta = (exerciseId?: string): ZoneKgMeta[] | null => {
  const { zoneMetaByExerciseId } = useContext(PlanStrongZoneKgContext);
  if (!exerciseId) return null;
  const arr = zoneMetaByExerciseId[exerciseId];
  if (!arr || arr.length === 0) return null;
  // dedupe by kg, keep first percentage
  const seen = new Set<number>();
  const out: ZoneKgMeta[] = [];
  for (const m of arr) {
    if (m.kg > 0 && !seen.has(m.kg)) {
      seen.add(m.kg);
      out.push(m);
    }
  }
  return out.sort((a, b) => a.kg - b.kg);
};

// Back-compat helper used elsewhere — returns just the kg numbers.
export const useZoneKgOptions = (exerciseId?: string): number[] | null => {
  const meta = useZoneKgMeta(exerciseId);
  return meta ? meta.map(m => m.kg) : null;
};
