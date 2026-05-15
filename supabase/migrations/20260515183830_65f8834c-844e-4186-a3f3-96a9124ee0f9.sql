
-- ============ feature_flags ============
CREATE TABLE public.feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key text UNIQUE NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read feature_flags"
  ON public.feature_flags FOR SELECT
  USING (public.is_admin_user());

CREATE POLICY "Admins can insert feature_flags"
  ON public.feature_flags FOR INSERT
  WITH CHECK (public.is_admin_user());

CREATE POLICY "Admins can update feature_flags"
  ON public.feature_flags FOR UPDATE
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

CREATE POLICY "Admins can delete feature_flags"
  ON public.feature_flags FOR DELETE
  USING (public.is_admin_user());

CREATE TRIGGER trg_feature_flags_updated_at
  BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.feature_flags (flag_key, enabled, description) VALUES
  ('ams_foundation', true, 'Core AMS foundation layer'),
  ('ams_acwr_chart', false, 'Acute:Chronic Workload Ratio chart'),
  ('ams_md_heatmap', false, 'Match-day heatmap'),
  ('ams_starter_balance', false, 'Starter vs non-starter balance'),
  ('ams_neuromuscular', false, 'Neuromuscular monitoring'),
  ('ams_phv_bioband', false, 'PHV / bio-banding'),
  ('ams_multidisciplinary_radar', false, 'Multidisciplinary radar'),
  ('ams_cho_periodization', false, 'CHO periodization'),
  ('ams_hydration_tracker', false, 'Hydration tracker'),
  ('ams_injury_registry', false, 'Injury registry'),
  ('ams_rtp_checklist', false, 'Return-to-play checklist'),
  ('ams_post_acl_monitor', false, 'Post-ACL monitor');

-- ============ performance_bands ============
CREATE TABLE public.performance_bands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid REFERENCES public.app_users(id) ON DELETE CASCADE,
  metric_key text NOT NULL,
  position_or_group text,
  sport text,
  age_group text,
  green_min numeric,
  green_max numeric,
  yellow_min numeric,
  yellow_max numeric,
  red_min numeric,
  red_max numeric,
  notes text,
  source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uniq_performance_bands_scope
  ON public.performance_bands (
    COALESCE(coach_id::text, ''),
    metric_key,
    COALESCE(position_or_group, ''),
    COALESCE(sport, ''),
    COALESCE(age_group, '')
  );

ALTER TABLE public.performance_bands ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_performance_bands_updated_at
  BEFORE UPDATE ON public.performance_bands
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Admins: full access
CREATE POLICY "Admins manage performance_bands"
  ON public.performance_bands FOR ALL
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- Coaches: own rows
CREATE POLICY "Coaches read own performance_bands"
  ON public.performance_bands FOR SELECT
  USING (
    coach_id = public.get_app_user_id_for_programs(auth.uid())
  );

CREATE POLICY "Coaches insert own performance_bands"
  ON public.performance_bands FOR INSERT
  WITH CHECK (
    coach_id = public.get_app_user_id_for_programs(auth.uid())
  );

CREATE POLICY "Coaches update own performance_bands"
  ON public.performance_bands FOR UPDATE
  USING (coach_id = public.get_app_user_id_for_programs(auth.uid()))
  WITH CHECK (coach_id = public.get_app_user_id_for_programs(auth.uid()));

CREATE POLICY "Coaches delete own performance_bands"
  ON public.performance_bands FOR DELETE
  USING (coach_id = public.get_app_user_id_for_programs(auth.uid()));

-- Global defaults visible to any authenticated user
CREATE POLICY "Authenticated read global performance_bands"
  ON public.performance_bands FOR SELECT
  TO authenticated
  USING (coach_id IS NULL);

-- Athletes: read bands of their coach
CREATE POLICY "Athletes read coach performance_bands"
  ON public.performance_bands FOR SELECT
  USING (
    coach_id IS NOT NULL
    AND coach_id = (
      SELECT coach_id FROM public.app_users WHERE auth_user_id = auth.uid() LIMIT 1
    )
  );

-- ============ classify_band function ============
CREATE OR REPLACE FUNCTION public.classify_band(metric_value numeric, band_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  b public.performance_bands%ROWTYPE;
BEGIN
  SELECT * INTO b FROM public.performance_bands WHERE id = band_id;
  IF NOT FOUND OR metric_value IS NULL THEN
    RETURN 'unknown';
  END IF;

  IF b.green_min IS NOT NULL AND b.green_max IS NOT NULL
     AND metric_value >= b.green_min AND metric_value <= b.green_max THEN
    RETURN 'green';
  END IF;

  IF b.yellow_min IS NOT NULL AND b.yellow_max IS NOT NULL
     AND metric_value >= b.yellow_min AND metric_value <= b.yellow_max THEN
    RETURN 'yellow';
  END IF;

  IF b.red_min IS NOT NULL AND b.red_max IS NOT NULL
     AND metric_value >= b.red_min AND metric_value <= b.red_max THEN
    RETURN 'red';
  END IF;

  -- Fallback: outside defined ranges -> red if red bounds exist as open thresholds
  IF (b.red_min IS NOT NULL AND metric_value < b.red_min)
     OR (b.red_max IS NOT NULL AND metric_value > b.red_max) THEN
    RETURN 'red';
  END IF;

  RETURN 'unknown';
END;
$$;

-- ============ Seed evidence-based default bands (global, coach_id NULL) ============
INSERT INTO public.performance_bands
  (coach_id, metric_key, green_min, green_max, yellow_min, yellow_max, red_min, red_max, notes, source)
VALUES
  (NULL, 'acwr', 0.8, 1.3, 0.5, 0.8, 0, 0.5,
    'ACWR sweet spot 0.8–1.3; under-loaded <0.8; danger zone >1.5',
    'Gabbett 2016 BJSM ACWR sweet spot'),
  (NULL, 'rsi', 2.0, 99, 1.5, 2.0, 0, 1.5,
    'Reactive Strength Index: >2.0 excellent, 1.5–2.0 moderate, <1.5 poor',
    'Flanagan & Comyns 2008'),
  (NULL, 'sleep_hours', 7.5, 12, 6.5, 7.5, 0, 6.5,
    'Sleep duration in hours; ≥7.5 optimal for athletes',
    'Walker 2017; Halson 2014'),
  (NULL, 'rpe_session', 0, 6, 7, 8, 9, 10,
    'Borg CR-10 session RPE; ≥9 indicates very high internal load',
    'Foster 2001 sRPE; Borg CR-10');

-- Extra ACWR upper-red row so 1.3–1.5 yellow / >1.5 red is captured per-side
-- (default classify uses single row; we duplicate yellow/red bounds via notes)
UPDATE public.performance_bands
SET yellow_max = 1.5, red_max = 99
WHERE metric_key = 'acwr' AND coach_id IS NULL;
