
-- Daily training load view (SECURITY INVOKER inherits workout_stats RLS)
CREATE OR REPLACE VIEW public.vw_daily_training_load
WITH (security_invoker = true) AS
SELECT
  user_id,
  scheduled_date::date AS load_date,
  COALESCE(SUM(total_volume_kg), 0)::numeric AS daily_volume_kg,
  COALESCE(SUM(total_duration_minutes), 0)::integer AS daily_duration_min,
  COUNT(DISTINCT assignment_id)::integer AS daily_session_count
FROM public.workout_stats
WHERE scheduled_date IS NOT NULL
GROUP BY user_id, scheduled_date::date;

-- ACWR computation function
CREATE OR REPLACE FUNCTION public.compute_acwr(
  p_user_id uuid,
  p_end_date date DEFAULT CURRENT_DATE,
  p_load_metric text DEFAULT 'volume_kg'
)
RETURNS TABLE(
  load_date date,
  daily_load numeric,
  acute_7d numeric,
  chronic_28d numeric,
  acwr numeric
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH date_series AS (
    SELECT (p_end_date - (g || ' days')::interval)::date AS d
    FROM generate_series(0, 59) g
  ),
  daily AS (
    SELECT
      ds.d AS load_date,
      COALESCE(
        CASE
          WHEN p_load_metric = 'duration_min' THEN v.daily_duration_min::numeric
          ELSE v.daily_volume_kg
        END,
        0
      ) AS daily_load
    FROM date_series ds
    LEFT JOIN public.vw_daily_training_load v
      ON v.user_id = p_user_id AND v.load_date = ds.d
  )
  SELECT
    d.load_date,
    d.daily_load,
    (
      SELECT COALESCE(SUM(d2.daily_load), 0)
      FROM daily d2
      WHERE d2.load_date BETWEEN d.load_date - 6 AND d.load_date
    ) AS acute_7d,
    (
      SELECT COALESCE(SUM(d2.daily_load), 0) / 4.0
      FROM daily d2
      WHERE d2.load_date BETWEEN d.load_date - 27 AND d.load_date
    ) AS chronic_28d,
    CASE
      WHEN (
        SELECT COALESCE(SUM(d2.daily_load), 0) / 4.0
        FROM daily d2
        WHERE d2.load_date BETWEEN d.load_date - 27 AND d.load_date
      ) > 0
      THEN (
        SELECT COALESCE(SUM(d2.daily_load), 0)
        FROM daily d2
        WHERE d2.load_date BETWEEN d.load_date - 6 AND d.load_date
      ) / NULLIF((
        SELECT COALESCE(SUM(d2.daily_load), 0) / 4.0
        FROM daily d2
        WHERE d2.load_date BETWEEN d.load_date - 27 AND d.load_date
      ), 0)
      ELSE NULL
    END AS acwr
  FROM daily d
  ORDER BY d.load_date ASC;
END;
$$;
