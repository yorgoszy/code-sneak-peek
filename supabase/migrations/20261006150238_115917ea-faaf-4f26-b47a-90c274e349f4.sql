CREATE TABLE public.heart_rate_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  device_name text,
  started_at timestamptz NOT NULL,
  ended_at timestamptz,
  duration_seconds integer,
  avg_bpm integer, max_bpm integer, min_bpm integer, rmssd integer,
  max_hr_setting integer,
  samples jsonb NOT NULL DEFAULT '[]'::jsonb,
  rr_intervals jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.heart_rate_sessions TO authenticated;
GRANT ALL ON public.heart_rate_sessions TO service_role;
ALTER TABLE public.heart_rate_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own HR sessions" ON public.heart_rate_sessions FOR ALL TO authenticated
USING (user_id = public.current_app_user_id() OR public.is_admin_user())
WITH CHECK (user_id = public.current_app_user_id() OR public.is_admin_user());
CREATE INDEX ON public.heart_rate_sessions(user_id, started_at DESC);