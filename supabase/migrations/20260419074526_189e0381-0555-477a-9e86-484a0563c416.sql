-- 1. Per-rep velocity measurements
CREATE TABLE public.exercise_rep_velocities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_result_id UUID NOT NULL REFERENCES public.exercise_results(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  exercise_id UUID NOT NULL,
  set_number INTEGER NOT NULL DEFAULT 1,
  rep_number INTEGER NOT NULL,
  velocity_ms NUMERIC(6,3) NOT NULL,
  peak_velocity_ms NUMERIC(6,3),
  weight_kg NUMERIC(6,2),
  rep_duration_ms INTEGER,
  source TEXT NOT NULL DEFAULT 'camera_hsv',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rep_velocities_user_exercise ON public.exercise_rep_velocities(user_id, exercise_id, created_at DESC);
CREATE INDEX idx_rep_velocities_result ON public.exercise_rep_velocities(exercise_result_id);

ALTER TABLE public.exercise_rep_velocities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own rep velocities"
  ON public.exercise_rep_velocities FOR SELECT
  USING (
    user_id IN (SELECT id FROM public.app_users WHERE auth_user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.app_users coach
      JOIN public.app_users athlete ON athlete.coach_id = coach.id
      WHERE coach.auth_user_id = auth.uid() AND athlete.id = exercise_rep_velocities.user_id
    )
    OR EXISTS (SELECT 1 FROM public.app_users WHERE auth_user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can insert their own rep velocities"
  ON public.exercise_rep_velocities FOR INSERT
  WITH CHECK (
    user_id IN (SELECT id FROM public.app_users WHERE auth_user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.app_users WHERE auth_user_id = auth.uid() AND role IN ('admin','coach'))
  );

CREATE POLICY "Coaches/admins can delete rep velocities"
  ON public.exercise_rep_velocities FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.app_users WHERE auth_user_id = auth.uid() AND role IN ('admin','coach')));

-- 2. Per user+exercise camera calibration (set by coach/admin)
CREATE TABLE public.exercise_camera_calibration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  exercise_id UUID NOT NULL,
  camera_distance_cm NUMERIC(6,2) NOT NULL,
  bar_length_cm NUMERIC(6,2) NOT NULL DEFAULT 220,
  expected_rom_cm NUMERIC(6,2),
  hsv_lower INTEGER[] NOT NULL DEFAULT ARRAY[35,100,100],
  hsv_upper INTEGER[] NOT NULL DEFAULT ARRAY[85,255,255],
  marker_color_label TEXT DEFAULT 'green',
  pixels_per_meter NUMERIC(8,2),
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, exercise_id)
);

CREATE INDEX idx_camera_calibration_user_exercise ON public.exercise_camera_calibration(user_id, exercise_id);

ALTER TABLE public.exercise_camera_calibration ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own calibration"
  ON public.exercise_camera_calibration FOR SELECT
  USING (
    user_id IN (SELECT id FROM public.app_users WHERE auth_user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.app_users coach
      JOIN public.app_users athlete ON athlete.coach_id = coach.id
      WHERE coach.auth_user_id = auth.uid() AND athlete.id = exercise_camera_calibration.user_id
    )
    OR EXISTS (SELECT 1 FROM public.app_users WHERE auth_user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Coaches/admins can manage calibration"
  ON public.exercise_camera_calibration FOR ALL
  USING (EXISTS (SELECT 1 FROM public.app_users WHERE auth_user_id = auth.uid() AND role IN ('admin','coach')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.app_users WHERE auth_user_id = auth.uid() AND role IN ('admin','coach')));

CREATE TRIGGER update_exercise_camera_calibration_updated_at
  BEFORE UPDATE ON public.exercise_camera_calibration
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();