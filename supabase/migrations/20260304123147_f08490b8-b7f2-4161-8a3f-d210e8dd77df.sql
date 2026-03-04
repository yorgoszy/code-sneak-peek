
-- Federation Competitions
CREATE TABLE public.federation_competitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  federation_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  competition_date DATE NOT NULL,
  registration_deadline DATE,
  regulations_pdf_url TEXT,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Competition Categories (age/weight)
CREATE TABLE public.federation_competition_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES public.federation_competitions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category_type TEXT NOT NULL CHECK (category_type IN ('age', 'weight', 'combined')),
  min_age INT,
  max_age INT,
  min_weight NUMERIC,
  max_weight NUMERIC,
  gender TEXT CHECK (gender IN ('male', 'female', 'mixed')),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Athlete Registrations by Clubs
CREATE TABLE public.federation_competition_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES public.federation_competitions(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.federation_competition_categories(id) ON DELETE CASCADE,
  club_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  weigh_in_weight NUMERIC,
  weigh_in_date TIMESTAMPTZ,
  weigh_in_status TEXT DEFAULT 'pending' CHECK (weigh_in_status IN ('pending', 'passed', 'failed', 'no_show')),
  registration_status TEXT NOT NULL DEFAULT 'registered' CHECK (registration_status IN ('registered', 'confirmed', 'withdrawn', 'disqualified')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(competition_id, category_id, athlete_id)
);

-- RLS
ALTER TABLE public.federation_competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.federation_competition_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.federation_competition_registrations ENABLE ROW LEVEL SECURITY;

-- Federation can manage their own competitions
CREATE POLICY "Federations manage own competitions" ON public.federation_competitions
  FOR ALL TO authenticated
  USING (federation_id IN (SELECT id FROM public.app_users WHERE auth_user_id = auth.uid()))
  WITH CHECK (federation_id IN (SELECT id FROM public.app_users WHERE auth_user_id = auth.uid()));

-- Coaches can view competitions from their federation
CREATE POLICY "Coaches view federation competitions" ON public.federation_competitions
  FOR SELECT TO authenticated
  USING (
    federation_id IN (
      SELECT federation_id FROM public.federation_clubs 
      WHERE club_id IN (SELECT id FROM public.app_users WHERE auth_user_id = auth.uid())
    )
  );

-- Categories: federation manages, coaches can view
CREATE POLICY "Federations manage competition categories" ON public.federation_competition_categories
  FOR ALL TO authenticated
  USING (
    competition_id IN (
      SELECT id FROM public.federation_competitions 
      WHERE federation_id IN (SELECT id FROM public.app_users WHERE auth_user_id = auth.uid())
    )
  )
  WITH CHECK (
    competition_id IN (
      SELECT id FROM public.federation_competitions 
      WHERE federation_id IN (SELECT id FROM public.app_users WHERE auth_user_id = auth.uid())
    )
  );

CREATE POLICY "Coaches view competition categories" ON public.federation_competition_categories
  FOR SELECT TO authenticated
  USING (
    competition_id IN (
      SELECT fc.id FROM public.federation_competitions fc
      JOIN public.federation_clubs fcl ON fcl.federation_id = fc.federation_id
      WHERE fcl.club_id IN (SELECT id FROM public.app_users WHERE auth_user_id = auth.uid())
    )
  );

-- Registrations: clubs manage their own, federation can view all
CREATE POLICY "Clubs manage own registrations" ON public.federation_competition_registrations
  FOR ALL TO authenticated
  USING (club_id IN (SELECT id FROM public.app_users WHERE auth_user_id = auth.uid()))
  WITH CHECK (club_id IN (SELECT id FROM public.app_users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Federations view all registrations" ON public.federation_competition_registrations
  FOR SELECT TO authenticated
  USING (
    competition_id IN (
      SELECT id FROM public.federation_competitions 
      WHERE federation_id IN (SELECT id FROM public.app_users WHERE auth_user_id = auth.uid())
    )
  );

-- Federation can update registrations (weigh-in)
CREATE POLICY "Federations update registrations" ON public.federation_competition_registrations
  FOR UPDATE TO authenticated
  USING (
    competition_id IN (
      SELECT id FROM public.federation_competitions 
      WHERE federation_id IN (SELECT id FROM public.app_users WHERE auth_user_id = auth.uid())
    )
  )
  WITH CHECK (
    competition_id IN (
      SELECT id FROM public.federation_competitions 
      WHERE federation_id IN (SELECT id FROM public.app_users WHERE auth_user_id = auth.uid())
    )
  );

-- Storage bucket for competition regulations PDFs
INSERT INTO storage.buckets (id, name, public) VALUES ('competition-regulations', 'competition-regulations', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Federation upload regulations" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'competition-regulations');

CREATE POLICY "Anyone can view regulations" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'competition-regulations');

CREATE POLICY "Federation delete regulations" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'competition-regulations');
