
CREATE TABLE public.game_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  coach_id uuid REFERENCES public.app_users(id) ON DELETE SET NULL,
  session_date date NOT NULL,
  session_type text NOT NULL CHECK (session_type IN ('match','training','ssg','conditioning','skills','rehab','other')),
  sport text,
  position_or_group text,
  duration_min integer NOT NULL,
  total_distance_m numeric,
  hsr_distance_m numeric,
  sprint_distance_m numeric,
  sprint_count integer,
  acc_count integer,
  dec_count integer,
  hmld_m numeric,
  max_speed_kmh numeric,
  relative_distance_m_per_min numeric GENERATED ALWAYS AS (
    CASE WHEN duration_min > 0 AND total_distance_m IS NOT NULL
      THEN total_distance_m / duration_min ELSE NULL END
  ) STORED,
  hsr_per_min numeric GENERATED ALWAYS AS (
    CASE WHEN duration_min > 0 AND hsr_distance_m IS NOT NULL
      THEN hsr_distance_m / duration_min ELSE NULL END
  ) STORED,
  notes text,
  imported_from text DEFAULT 'manual',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_game_sessions_athlete ON public.game_sessions(athlete_id, session_date DESC);
CREATE INDEX idx_game_sessions_coach ON public.game_sessions(coach_id, session_date DESC);

ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View game sessions"
ON public.game_sessions FOR SELECT
USING (
  athlete_id IN (SELECT id FROM public.app_users WHERE auth_user_id = auth.uid())
  OR coach_id IN (SELECT id FROM public.app_users WHERE auth_user_id = auth.uid())
  OR public.is_admin_user()
);

CREATE POLICY "Coaches insert game sessions"
ON public.game_sessions FOR INSERT
WITH CHECK (
  public.is_coach_user(auth.uid())
);

CREATE POLICY "Coaches update game sessions"
ON public.game_sessions FOR UPDATE
USING (
  coach_id IN (SELECT id FROM public.app_users WHERE auth_user_id = auth.uid())
  OR public.is_admin_user()
);

CREATE POLICY "Coaches delete game sessions"
ON public.game_sessions FOR DELETE
USING (
  coach_id IN (SELECT id FROM public.app_users WHERE auth_user_id = auth.uid())
  OR public.is_admin_user()
);

CREATE TRIGGER update_game_sessions_updated_at
BEFORE UPDATE ON public.game_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
