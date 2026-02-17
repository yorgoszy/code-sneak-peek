
import { supabase } from '@/integrations/supabase/client';
import { buildVelocityProfile, predictVelocityFromPercentage, type VelocityProfile, type LoadVelocityPoint } from '@/utils/velocityPrediction';

/**
 * Fetches a user's 1RM and velocity data, then recalculates kg and m/s
 * for all exercises in the program structure based on their %1RM values.
 * Used during assignment to personalize each user's program.
 */
export async function recalculateWeeksForUser(
  weeks: any[],
  userId: string
): Promise<any[]> {
  // 1. Fetch 1RM data
  const { data: rmData } = await supabase
    .from('user_exercise_1rm' as any)
    .select('exercise_id, weight, recorded_date')
    .eq('user_id', userId)
    .order('recorded_date', { ascending: false });

  const rmMap = new Map<string, number>();
  if (rmData) {
    for (const row of rmData as any[]) {
      if (!rmMap.has(row.exercise_id)) {
        rmMap.set(row.exercise_id, row.weight);
      }
    }
  }

  // 2. Fetch exercise relationships (strength_variant) for linked 1RM lookup
  const { data: relData } = await supabase
    .from('exercise_relationships')
    .select('exercise_id, related_exercise_id')
    .eq('relationship_type', 'strength_variant');

  const linkMap = new Map<string, string[]>();
  if (relData) {
    const adj = new Map<string, Set<string>>();
    for (const rel of relData) {
      if (!adj.has(rel.exercise_id)) adj.set(rel.exercise_id, new Set());
      if (!adj.has(rel.related_exercise_id)) adj.set(rel.related_exercise_id, new Set());
      adj.get(rel.exercise_id)!.add(rel.related_exercise_id);
      adj.get(rel.related_exercise_id)!.add(rel.exercise_id);
    }
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
      for (const id of group) {
        linkMap.set(id, group.filter(g => g !== id));
      }
    }
  }

  // 3. Fetch velocity profiles
  const { data: velocityData } = await supabase
    .from('strength_test_attempts')
    .select(`exercise_id, weight_kg, velocity_ms, strength_test_sessions!inner (user_id)`)
    .eq('strength_test_sessions.user_id', userId)
    .not('velocity_ms', 'is', null)
    .gt('velocity_ms', 0);

  const velocityProfiles = new Map<string, VelocityProfile>();
  const exerciseIdsWithVelocity = new Set<string>();
  if (velocityData) {
    for (const v of velocityData) {
      if (v.exercise_id) exerciseIdsWithVelocity.add(v.exercise_id);
    }
  }

  if (exerciseIdsWithVelocity.size > 0) {
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
            velocityProfiles.set(exId, profile);
          }
        }
      }
    }
  }

  // Helper: get 1RM with linked exercise fallback
  const getOneRM = (exerciseId: string): number | null => {
    const direct = rmMap.get(exerciseId);
    if (direct !== undefined) return direct;
    const linked = linkMap.get(exerciseId);
    if (linked) {
      for (const linkedId of linked) {
        const linkedRM = rmMap.get(linkedId);
        if (linkedRM !== undefined) return linkedRM;
      }
    }
    return null;
  };

  // Helper: get velocity with linked exercise fallback
  const getVelocity = (exerciseId: string, percentage: number, oneRM: number): number | null => {
    const profile = velocityProfiles.get(exerciseId);
    if (profile) return predictVelocityFromPercentage(profile, percentage, oneRM);
    const linked = linkMap.get(exerciseId);
    if (linked) {
      for (const linkedId of linked) {
        const linkedProfile = velocityProfiles.get(linkedId);
        if (linkedProfile) return predictVelocityFromPercentage(linkedProfile, percentage, oneRM);
      }
    }
    return null;
  };

  // 4. Recalculate all exercises
  return weeks.map(week => ({
    ...week,
    program_days: (week.program_days || []).map((day: any) => ({
      ...day,
      program_blocks: (day.program_blocks || []).map((block: any) => ({
        ...block,
        program_exercises: (block.program_exercises || []).map((ex: any) => {
          if (!ex.exercise_id) return ex;
          
          const oneRM = getOneRM(ex.exercise_id);
          if (!oneRM) return ex;

          const hasPercentage = ex.percentage_1rm && 
            parseFloat(ex.percentage_1rm.toString().replace(',', '.')) > 0;

          let newKg = ex.kg;
          let newVelocity = ex.velocity_ms;

          if (hasPercentage) {
            const percentage = parseFloat(ex.percentage_1rm.toString().replace(',', '.'));
            const calculatedKg = (oneRM * percentage) / 100;
            let roundedWeight = Math.round(calculatedKg);
            if (roundedWeight % 2 !== 0) {
              const lower = roundedWeight - 1;
              const upper = roundedWeight + 1;
              roundedWeight = Math.abs(calculatedKg - lower) < Math.abs(calculatedKg - upper) ? lower : upper;
            }
            newKg = roundedWeight.toString().replace('.', ',');

            const predictedVelocity = getVelocity(ex.exercise_id, percentage, oneRM);
            if (predictedVelocity !== null) {
              newVelocity = predictedVelocity;
            }
          }

          return { ...ex, kg: newKg, velocity_ms: newVelocity };
        })
      }))
    }))
  }));
}
