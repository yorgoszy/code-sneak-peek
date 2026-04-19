-- Extend exercise_rep_velocities with full per-rep metrics
ALTER TABLE public.exercise_rep_velocities
  ADD COLUMN IF NOT EXISTS mean_velocity_ms NUMERIC(6,3),
  ADD COLUMN IF NOT EXISTS peak_velocity_ms NUMERIC(6,3),
  ADD COLUMN IF NOT EXISTS mean_eccentric_velocity_ms NUMERIC(6,3),
  ADD COLUMN IF NOT EXISTS peak_eccentric_velocity_ms NUMERIC(6,3),
  ADD COLUMN IF NOT EXISTS mean_power_w NUMERIC(8,2),
  ADD COLUMN IF NOT EXISTS peak_power_w NUMERIC(8,2),
  ADD COLUMN IF NOT EXISTS range_of_motion_cm NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS bar_movement_duration_ms INTEGER,
  ADD COLUMN IF NOT EXISTS rep_total_duration_ms INTEGER,
  ADD COLUMN IF NOT EXISTS concentric_duration_ms INTEGER,
  ADD COLUMN IF NOT EXISTS eccentric_duration_ms INTEGER,
  ADD COLUMN IF NOT EXISTS load_kg NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS rep_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rep_ended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS raw_samples JSONB;

CREATE INDEX IF NOT EXISTS idx_exercise_rep_velocities_result
  ON public.exercise_rep_velocities(exercise_result_id);
CREATE INDEX IF NOT EXISTS idx_exercise_rep_velocities_set_rep
  ON public.exercise_rep_velocities(exercise_result_id, set_number, rep_number);