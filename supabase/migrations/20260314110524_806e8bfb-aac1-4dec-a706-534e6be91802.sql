
-- Table for storing live match analysis data per athlete per match
CREATE TABLE public.competition_match_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  competition_id UUID NOT NULL REFERENCES public.federation_competitions(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES public.competition_matches(id) ON DELETE CASCADE,
  ring_id UUID NOT NULL REFERENCES public.competition_rings(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  corner TEXT NOT NULL CHECK (corner IN ('red', 'blue')),
  round_number INTEGER NOT NULL DEFAULT 1,
  timestamp_seconds NUMERIC NOT NULL DEFAULT 0,
  event_type TEXT NOT NULL CHECK (event_type IN ('attack', 'defense', 'strike', 'clinch')),
  strike_type TEXT, -- e.g. jab, cross, hook, roundhouse_kick, etc.
  strike_category TEXT, -- punch, kick, knee, elbow
  strike_side TEXT, -- left, right
  is_successful BOOLEAN DEFAULT true,
  is_blocked BOOLEAN DEFAULT false,
  confidence NUMERIC DEFAULT 1.0,
  detection_method TEXT NOT NULL DEFAULT 'manual' CHECK (detection_method IN ('manual', 'ai', 'hybrid')),
  notes TEXT,
  created_by UUID REFERENCES public.app_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Summary stats per match per athlete (aggregated)
CREATE TABLE public.competition_match_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  competition_id UUID NOT NULL REFERENCES public.federation_competitions(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES public.competition_matches(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  corner TEXT NOT NULL CHECK (corner IN ('red', 'blue')),
  total_strikes INTEGER DEFAULT 0,
  total_punches INTEGER DEFAULT 0,
  total_kicks INTEGER DEFAULT 0,
  total_knees INTEGER DEFAULT 0,
  total_elbows INTEGER DEFAULT 0,
  total_attacks INTEGER DEFAULT 0,
  total_defenses INTEGER DEFAULT 0,
  successful_strikes INTEGER DEFAULT 0,
  blocked_strikes INTEGER DEFAULT 0,
  strike_accuracy NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(match_id, athlete_id)
);

-- Indexes
CREATE INDEX idx_match_analysis_match ON public.competition_match_analysis(match_id);
CREATE INDEX idx_match_analysis_athlete ON public.competition_match_analysis(athlete_id);
CREATE INDEX idx_match_analysis_competition ON public.competition_match_analysis(competition_id);
CREATE INDEX idx_match_stats_match ON public.competition_match_stats(match_id);
CREATE INDEX idx_match_stats_athlete ON public.competition_match_stats(athlete_id);

-- RLS
ALTER TABLE public.competition_match_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_match_stats ENABLE ROW LEVEL SECURITY;

-- Federation users can read/write analysis for their competitions
CREATE POLICY "Federation can manage match analysis"
  ON public.competition_match_analysis
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.federation_competitions fc
      WHERE fc.id = competition_id
        AND fc.federation_id = (SELECT id FROM public.app_users WHERE auth_user_id = auth.uid() LIMIT 1)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.federation_competitions fc
      WHERE fc.id = competition_id
        AND fc.federation_id = (SELECT id FROM public.app_users WHERE auth_user_id = auth.uid() LIMIT 1)
    )
  );

-- Coaches can read analysis for competitions they participate in
CREATE POLICY "Coaches can read match analysis"
  ON public.competition_match_analysis
  FOR SELECT
  TO authenticated
  USING (
    public.is_coach_competition_athlete(auth.uid(), athlete_id)
  );

CREATE POLICY "Federation can manage match stats"
  ON public.competition_match_stats
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.federation_competitions fc
      WHERE fc.id = competition_id
        AND fc.federation_id = (SELECT id FROM public.app_users WHERE auth_user_id = auth.uid() LIMIT 1)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.federation_competitions fc
      WHERE fc.id = competition_id
        AND fc.federation_id = (SELECT id FROM public.app_users WHERE auth_user_id = auth.uid() LIMIT 1)
    )
  );

CREATE POLICY "Coaches can read match stats"
  ON public.competition_match_stats
  FOR SELECT
  TO authenticated
  USING (
    public.is_coach_competition_athlete(auth.uid(), athlete_id)
  );

-- Updated_at trigger
CREATE TRIGGER update_match_analysis_updated_at
  BEFORE UPDATE ON public.competition_match_analysis
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_match_stats_updated_at
  BEFORE UPDATE ON public.competition_match_stats
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
