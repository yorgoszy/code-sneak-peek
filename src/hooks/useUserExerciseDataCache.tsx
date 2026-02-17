import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { buildVelocityProfile, predictVelocityFromPercentage, type VelocityProfile, type LoadVelocityPoint } from '@/utils/velocityPrediction';

interface ExerciseData1RM {
  weight: number;
  exerciseId: string; // source exercise id (could be linked)
}

interface UserExerciseDataCache {
  /** Get 1RM for an exercise (checks linked exercises too) */
  getOneRM: (exerciseId: string) => number | null;
  /** Get velocity prediction for a percentage */
  getVelocityForPercentage: (exerciseId: string, percentage: number, oneRM: number) => number | null;
  /** Whether data is still loading */
  loading: boolean;
  /** The user ID this cache is for */
  userId: string | null;
}

const UserExerciseDataCacheContext = createContext<UserExerciseDataCache>({
  getOneRM: () => null,
  getVelocityForPercentage: () => null,
  loading: false,
  userId: null,
});

export const useUserExerciseDataCacheContext = () => useContext(UserExerciseDataCacheContext);

interface Props {
  userId: string | null;
  children: React.ReactNode;
}

export const UserExerciseDataCacheProvider: React.FC<Props> = ({ userId, children }) => {
  // Map: exerciseId -> 1RM weight
  const [rmMap, setRmMap] = useState<Map<string, number>>(new Map());
  // Map: exerciseId -> Set of linked exercise IDs
  const [linkMap, setLinkMap] = useState<Map<string, string[]>>(new Map());
  // Map: exerciseId -> VelocityProfile
  const [velocityProfiles, setVelocityProfiles] = useState<Map<string, VelocityProfile>>(new Map());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setRmMap(new Map());
    setLinkMap(new Map());
    setVelocityProfiles(new Map());

    if (!userId) return;

    const fetchAll = async () => {
      setLoading(true);
      try {
        // 1. Fetch ALL 1RM records for this user in ONE query
        const { data: rmData } = await supabase
          .from('user_exercise_1rm' as any)
          .select('exercise_id, weight, recorded_date')
          .eq('user_id', userId)
          .order('recorded_date', { ascending: false });

        const newRmMap = new Map<string, number>();
        if (rmData) {
          for (const row of rmData as any[]) {
            // Keep only the latest per exercise
            if (!newRmMap.has(row.exercise_id)) {
              newRmMap.set(row.exercise_id, row.weight);
            }
          }
        }

        // 2. Fetch ALL exercise relationships (strength_variant) in ONE query
        const { data: relData } = await supabase
          .from('exercise_relationships')
          .select('exercise_id, related_exercise_id')
          .eq('relationship_type', 'strength_variant');

        const newLinkMap = new Map<string, string[]>();
        if (relData) {
          // Build adjacency list
          const adj = new Map<string, Set<string>>();
          for (const rel of relData) {
            if (!adj.has(rel.exercise_id)) adj.set(rel.exercise_id, new Set());
            if (!adj.has(rel.related_exercise_id)) adj.set(rel.related_exercise_id, new Set());
            adj.get(rel.exercise_id)!.add(rel.related_exercise_id);
            adj.get(rel.related_exercise_id)!.add(rel.exercise_id);
          }

          // Build transitive groups using BFS so A→B→C means A is linked to both B and C
          const visited = new Set<string>();
          for (const startId of adj.keys()) {
            if (visited.has(startId)) continue;
            const group: string[] = [];
            const queue = [startId];
            while (queue.length > 0) {
              const current = queue.pop()!;
              if (visited.has(current)) continue;
              visited.add(current);
              group.push(current);
              for (const neighbor of adj.get(current) || []) {
                if (!visited.has(neighbor)) queue.push(neighbor);
              }
            }
            // Each member of the group links to all OTHER members
            for (const id of group) {
              newLinkMap.set(id, group.filter(g => g !== id));
            }
          }
        }

        // 3. Fetch ALL velocity data for this user in ONE query
        const { data: velocityData } = await supabase
          .from('strength_test_attempts')
          .select(`
            exercise_id,
            weight_kg,
            velocity_ms,
            strength_test_sessions!inner (user_id)
          `)
          .eq('strength_test_sessions.user_id', userId)
          .not('velocity_ms', 'is', null)
          .gt('velocity_ms', 0);

        // 4. Fetch terminal velocities for exercises that have velocity data
        const exerciseIdsWithVelocity = new Set<string>();
        if (velocityData) {
          for (const v of velocityData) {
            if (v.exercise_id) exerciseIdsWithVelocity.add(v.exercise_id);
          }
        }

        const newVelocityProfiles = new Map<string, VelocityProfile>();
        if (exerciseIdsWithVelocity.size > 0) {
          // Fetch terminal velocities (may be null for some exercises)
          const { data: exercisesData } = await supabase
            .from('exercises')
            .select('id, terminal_velocity')
            .in('id', Array.from(exerciseIdsWithVelocity));

          const tvMap = new Map<string, number | null>();
          if (exercisesData) {
            for (const ex of exercisesData) {
              tvMap.set(ex.id, ex.terminal_velocity);
            }
          }

          if (velocityData) {
            // Group velocity data by exercise
            const pointsByExercise = new Map<string, LoadVelocityPoint[]>();
            for (const v of velocityData) {
              if (!v.exercise_id) continue;
              const pts = pointsByExercise.get(v.exercise_id) || [];
              pts.push({ weight_kg: v.weight_kg, velocity_ms: v.velocity_ms! });
              pointsByExercise.set(v.exercise_id, pts);
            }

            for (const [exId, points] of pointsByExercise) {
              if (points.length >= 2) {
                const tv = tvMap.get(exId);
                const profile = buildVelocityProfile(points, tv ?? 0);
                if (profile) {
                  newVelocityProfiles.set(exId, profile);
                }
              }
            }
          }
        }

        setRmMap(newRmMap);
        setLinkMap(newLinkMap);
        setVelocityProfiles(newVelocityProfiles);
      } catch (err) {
        console.error('Error fetching user exercise data cache:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [userId]);

  const getOneRM = useCallback((exerciseId: string): number | null => {
    // Direct match
    const direct = rmMap.get(exerciseId);
    if (direct !== undefined) return direct;

    // Check linked exercises
    const linked = linkMap.get(exerciseId);
    if (linked) {
      for (const linkedId of linked) {
        const linkedRM = rmMap.get(linkedId);
        if (linkedRM !== undefined) return linkedRM;
      }
    }

    return null;
  }, [rmMap, linkMap]);

  const getVelocityForPercentage = useCallback((exerciseId: string, percentage: number, oneRM: number): number | null => {
    // Direct match
    const profile = velocityProfiles.get(exerciseId);
    if (profile) return predictVelocityFromPercentage(profile, percentage, oneRM);

    // Check linked exercises
    const linked = linkMap.get(exerciseId);
    if (linked) {
      for (const linkedId of linked) {
        const linkedProfile = velocityProfiles.get(linkedId);
        if (linkedProfile) return predictVelocityFromPercentage(linkedProfile, percentage, oneRM);
      }
    }

    return null;
  }, [velocityProfiles, linkMap]);

  const value = useMemo(() => ({
    getOneRM,
    getVelocityForPercentage,
    loading,
    userId,
  }), [getOneRM, getVelocityForPercentage, loading, userId]);

  return (
    <UserExerciseDataCacheContext.Provider value={value}>
      {children}
    </UserExerciseDataCacheContext.Provider>
  );
};
