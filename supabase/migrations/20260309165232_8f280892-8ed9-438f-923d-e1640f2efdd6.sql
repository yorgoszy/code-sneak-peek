
-- Table to store competition results (placement per athlete per category)
CREATE TABLE public.federation_competition_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid NOT NULL REFERENCES public.federation_competitions(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.federation_competition_categories(id) ON DELETE CASCADE,
  athlete_id uuid NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  club_id uuid REFERENCES public.app_users(id) ON DELETE SET NULL,
  placement integer NOT NULL, -- 1=1st, 2=2nd, 3=3rd, etc.
  points integer NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(competition_id, category_id, athlete_id)
);

ALTER TABLE public.federation_competition_results ENABLE ROW LEVEL SECURITY;

-- Ranking points configuration per federation
CREATE TABLE public.federation_ranking_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  federation_id uuid NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  placement integer NOT NULL, -- 1, 2, 3, etc.
  points integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(federation_id, placement)
);

ALTER TABLE public.federation_ranking_points ENABLE ROW LEVEL SECURITY;

-- Default ranking points for existing federations
-- We won't insert defaults here, the app will handle it

-- RLS: Federations can manage their own results
CREATE POLICY "federations_manage_results" ON public.federation_competition_results
  FOR ALL TO authenticated
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

-- RLS: Everyone in the federation ecosystem can READ results
CREATE POLICY "read_results_federation_members" ON public.federation_competition_results
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.federation_competitions fc
      JOIN public.federation_clubs fcl ON fcl.federation_id = fc.federation_id
      WHERE fc.id = competition_id
      AND fcl.club_id = (SELECT id FROM public.app_users WHERE auth_user_id = auth.uid() LIMIT 1)
    )
    OR
    EXISTS (
      SELECT 1 FROM public.federation_competitions fc
      JOIN public.federation_clubs fcl ON fcl.federation_id = fc.federation_id
      JOIN public.app_users au ON au.coach_id = fcl.club_id
      WHERE fc.id = competition_id
      AND au.auth_user_id = auth.uid()
    )
  );

-- RLS for ranking points config
CREATE POLICY "federations_manage_ranking_points" ON public.federation_ranking_points
  FOR ALL TO authenticated
  USING (
    federation_id = (SELECT id FROM public.app_users WHERE auth_user_id = auth.uid() LIMIT 1)
  )
  WITH CHECK (
    federation_id = (SELECT id FROM public.app_users WHERE auth_user_id = auth.uid() LIMIT 1)
  );

CREATE POLICY "read_ranking_points" ON public.federation_ranking_points
  FOR SELECT TO authenticated
  USING (true);
