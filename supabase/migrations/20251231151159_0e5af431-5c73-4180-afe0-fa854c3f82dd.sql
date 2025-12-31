-- Allow switching coach progress tracking from legacy coach_users to app_users
-- We keep the legacy coach_user_id FK but make it nullable; new records will use user_id (app_users).

ALTER TABLE public.coach_strength_test_sessions
  ALTER COLUMN coach_user_id DROP NOT NULL;

ALTER TABLE public.coach_endurance_test_sessions
  ALTER COLUMN coach_user_id DROP NOT NULL;

ALTER TABLE public.coach_jump_test_sessions
  ALTER COLUMN coach_user_id DROP NOT NULL;

ALTER TABLE public.coach_anthropometric_test_sessions
  ALTER COLUMN coach_user_id DROP NOT NULL;

ALTER TABLE public.coach_functional_test_sessions
  ALTER COLUMN coach_user_id DROP NOT NULL;

-- Optional (safe) indexes for faster history queries by coach/user
CREATE INDEX IF NOT EXISTS idx_coach_strength_sessions_coach_user
  ON public.coach_strength_test_sessions (coach_id, user_id, test_date);

CREATE INDEX IF NOT EXISTS idx_coach_endurance_sessions_coach_user
  ON public.coach_endurance_test_sessions (coach_id, user_id, test_date);

CREATE INDEX IF NOT EXISTS idx_coach_jump_sessions_coach_user
  ON public.coach_jump_test_sessions (coach_id, user_id, test_date);

CREATE INDEX IF NOT EXISTS idx_coach_anthro_sessions_coach_user
  ON public.coach_anthropometric_test_sessions (coach_id, user_id, test_date);

CREATE INDEX IF NOT EXISTS idx_coach_functional_sessions_coach_user
  ON public.coach_functional_test_sessions (coach_id, user_id, test_date);
