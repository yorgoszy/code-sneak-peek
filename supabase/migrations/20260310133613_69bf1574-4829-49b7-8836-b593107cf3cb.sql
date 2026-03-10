
-- Table for tournament matches/brackets
CREATE TABLE public.competition_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES public.federation_competitions(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.federation_competition_categories(id) ON DELETE CASCADE,
  round_number INT NOT NULL, -- 1=final, 2=semi, 4=quarter, 8=round of 16, etc.
  match_number INT NOT NULL, -- position within the round
  match_order INT, -- global order for scheduling (fight 1, fight 2, etc.)
  athlete1_id UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  athlete2_id UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  athlete1_club_id UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  athlete2_club_id UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  winner_id UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  athlete1_score TEXT, -- e.g. "3-0", "KO", "TKO"
  athlete2_score TEXT,
  result_type TEXT, -- 'points', 'ko', 'tko', 'dq', 'bye'
  is_bye BOOLEAN DEFAULT false,
  ring_number INT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, in_progress, completed
  scheduled_time TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table for competition ring configuration
CREATE TABLE public.competition_rings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES public.federation_competitions(id) ON DELETE CASCADE,
  ring_number INT NOT NULL,
  ring_name TEXT, -- e.g. "Ring A", "Ring 1"
  youtube_live_url TEXT,
  match_range_start INT, -- fight number start
  match_range_end INT, -- fight number end
  current_match_id UUID REFERENCES public.competition_matches(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(competition_id, ring_number)
);

-- Enable RLS
ALTER TABLE public.competition_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_rings ENABLE ROW LEVEL SECURITY;

-- RLS policies for competition_matches
CREATE POLICY "Anyone can view competition matches"
  ON public.competition_matches FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Federation can manage their competition matches"
  ON public.competition_matches FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.federation_competitions fc
      WHERE fc.id = competition_id
        AND fc.federation_id = public.get_app_user_id_safe(auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.federation_competitions fc
      WHERE fc.id = competition_id
        AND fc.federation_id = public.get_app_user_id_safe(auth.uid())
    )
  );

CREATE POLICY "Admins can manage all competition matches"
  ON public.competition_matches FOR ALL
  TO authenticated
  USING (public.is_admin_safe(auth.uid()))
  WITH CHECK (public.is_admin_safe(auth.uid()));

-- RLS policies for competition_rings
CREATE POLICY "Anyone can view competition rings"
  ON public.competition_rings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Federation can manage their competition rings"
  ON public.competition_rings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.federation_competitions fc
      WHERE fc.id = competition_id
        AND fc.federation_id = public.get_app_user_id_safe(auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.federation_competitions fc
      WHERE fc.id = competition_id
        AND fc.federation_id = public.get_app_user_id_safe(auth.uid())
    )
  );

CREATE POLICY "Admins can manage all competition rings"
  ON public.competition_rings FOR ALL
  TO authenticated
  USING (public.is_admin_safe(auth.uid()))
  WITH CHECK (public.is_admin_safe(auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER update_competition_matches_updated_at
  BEFORE UPDATE ON public.competition_matches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_competition_rings_updated_at
  BEFORE UPDATE ON public.competition_rings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
