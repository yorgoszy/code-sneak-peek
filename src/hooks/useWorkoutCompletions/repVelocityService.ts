import { supabase } from "@/integrations/supabase/client";
import type { RepMetrics } from "@/utils/barVelocityTracker";

export interface SaveRepContext {
  exercise_result_id: string;
  exercise_id: string;
  user_id: string;
}

export const saveRepVelocity = async (
  ctx: SaveRepContext,
  rep: RepMetrics
) => {
  const { data, error } = await supabase
    .from('exercise_rep_velocities')
    .insert({
      exercise_result_id: ctx.exercise_result_id,
      exercise_id: ctx.exercise_id,
      user_id: ctx.user_id,
      set_number: rep.set_number,
      rep_number: rep.rep_number,
      load_kg: rep.load_kg,
      weight_kg: rep.load_kg,
      mean_velocity_ms: rep.mean_velocity_ms,
      peak_velocity_ms: rep.peak_velocity_ms,
      mean_eccentric_velocity_ms: rep.mean_eccentric_velocity_ms,
      peak_eccentric_velocity_ms: rep.peak_eccentric_velocity_ms,
      mean_power_w: rep.mean_power_w,
      peak_power_w: rep.peak_power_w,
      range_of_motion_cm: rep.range_of_motion_cm,
      bar_movement_duration_ms: rep.bar_movement_duration_ms,
      rep_total_duration_ms: rep.rep_total_duration_ms,
      rep_duration_ms: rep.rep_total_duration_ms,
      concentric_duration_ms: rep.concentric_duration_ms,
      eccentric_duration_ms: rep.eccentric_duration_ms,
      rep_started_at: rep.rep_started_at,
      rep_ended_at: rep.rep_ended_at,
      velocity_ms: rep.mean_velocity_ms,
      raw_samples: rep.raw_samples as any,
      source: 'camera_hsv',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getRepVelocities = async (exerciseResultId: string) => {
  const { data, error } = await supabase
    .from('exercise_rep_velocities')
    .select('*')
    .eq('exercise_result_id', exerciseResultId)
    .order('set_number', { ascending: true })
    .order('rep_number', { ascending: true });
  if (error) throw error;
  return data || [];
};
