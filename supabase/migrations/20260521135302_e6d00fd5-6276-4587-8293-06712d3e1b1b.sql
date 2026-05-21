
CREATE TABLE IF NOT EXISTS public.sprint_efforts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_session_id uuid NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  athlete_id uuid NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  sprint_start_seconds numeric NOT NULL,
  sprint_duration_sec numeric NOT NULL,
  sprint_distance_m numeric,
  max_speed_kmh numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sprint_efforts_session_start
  ON public.sprint_efforts (game_session_id, sprint_start_seconds);

ALTER TABLE public.sprint_efforts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View sprint efforts"
  ON public.sprint_efforts FOR SELECT
  USING (
    athlete_id IN (SELECT id FROM public.app_users WHERE auth_user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.game_sessions gs
      WHERE gs.id = sprint_efforts.game_session_id
        AND gs.coach_id IN (SELECT id FROM public.app_users WHERE auth_user_id = auth.uid())
    )
    OR is_admin_user()
  );

CREATE POLICY "Coaches insert sprint efforts"
  ON public.sprint_efforts FOR INSERT
  WITH CHECK (is_coach_user(auth.uid()) OR is_admin_user());

CREATE POLICY "Coaches update sprint efforts"
  ON public.sprint_efforts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.game_sessions gs
      WHERE gs.id = sprint_efforts.game_session_id
        AND gs.coach_id IN (SELECT id FROM public.app_users WHERE auth_user_id = auth.uid())
    )
    OR is_admin_user()
  );

CREATE POLICY "Coaches delete sprint efforts"
  ON public.sprint_efforts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.game_sessions gs
      WHERE gs.id = sprint_efforts.game_session_id
        AND gs.coach_id IN (SELECT id FROM public.app_users WHERE auth_user_id = auth.uid())
    )
    OR is_admin_user()
  );

CREATE OR REPLACE FUNCTION public.detect_rsbs(p_session_id uuid)
RETURNS TABLE(
  rsb_index integer,
  sprint_count integer,
  total_duration_sec numeric,
  mean_recovery_sec numeric,
  work_rest_ratio numeric,
  first_sprint_start_sec numeric
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH ordered AS (
    SELECT
      sprint_start_seconds AS s_start,
      sprint_duration_sec AS s_dur,
      sprint_start_seconds + sprint_duration_sec AS s_end,
      LAG(sprint_start_seconds + sprint_duration_sec)
        OVER (ORDER BY sprint_start_seconds) AS prev_end
    FROM public.sprint_efforts
    WHERE game_session_id = p_session_id
  ),
  flagged AS (
    SELECT
      s_start, s_dur, s_end, prev_end,
      CASE
        WHEN prev_end IS NULL OR (s_start - prev_end) > 21 THEN 1
        ELSE 0
      END AS new_group
    FROM ordered
  ),
  grouped AS (
    SELECT
      s_start, s_dur, s_end, prev_end,
      SUM(new_group) OVER (ORDER BY s_start ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS grp
    FROM flagged
  ),
  agg AS (
    SELECT
      grp,
      COUNT(*)::int AS sprints,
      MIN(s_start) AS first_start,
      MAX(s_end) AS last_end,
      SUM(s_dur) AS work_sec,
      COALESCE(AVG(s_start - prev_end) FILTER (WHERE prev_end IS NOT NULL AND (s_start - prev_end) <= 21), 0) AS mean_rec
    FROM grouped
    GROUP BY grp
  )
  SELECT
    ROW_NUMBER() OVER (ORDER BY first_start)::int AS rsb_index,
    sprints AS sprint_count,
    (last_end - first_start)::numeric AS total_duration_sec,
    mean_rec::numeric AS mean_recovery_sec,
    CASE WHEN (last_end - first_start - work_sec) > 0
         THEN (work_sec / (last_end - first_start - work_sec))::numeric
         ELSE NULL END AS work_rest_ratio,
    first_start::numeric AS first_sprint_start_sec
  FROM agg
  WHERE sprints >= 3
  ORDER BY first_start;
END;
$$;

INSERT INTO public.performance_bands (coach_id, metric_key, sport, position_or_group, green_min, green_max, yellow_min, yellow_max, red_min, red_max, source)
VALUES
  (NULL, 'relative_distance_m_per_min', 'soccer', NULL, 100, 130, 80, 100, 0, 80, 'Gabbett 2013, Aughey 2011'),
  (NULL, 'hsr_per_min', 'soccer', NULL, 10, 25, 5, 10, 0, 5, 'Gabbett 2016 HSR phases'),
  (NULL, 'rsb_count_per_session', 'soccer', 'midfielder', 4, 8, 2, 4, 0, 2, 'Gabbett & Mulvey 2008'),
  (NULL, 'sprints_per_session', 'soccer', NULL, 15, 30, 8, 15, 0, 8, 'Bradley et al. 2014')
ON CONFLICT DO NOTHING;

INSERT INTO public.feature_flags (flag_key, description, enabled)
VALUES ('ams_game_demand_analyzer', 'Game Demand Analyzer with RSB detection', false)
ON CONFLICT (flag_key) DO NOTHING;
