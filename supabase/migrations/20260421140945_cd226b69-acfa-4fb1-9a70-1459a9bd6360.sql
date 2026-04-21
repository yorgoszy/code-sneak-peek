-- Sports
CREATE TABLE public.ekouros_sports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  name_normalized TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ekouros_sports_norm ON public.ekouros_sports(name_normalized);

-- Federations
CREATE TABLE public.ekouros_federations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  name_normalized TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ekouros_feds_norm ON public.ekouros_federations(name_normalized);

-- Clubs
CREATE TABLE public.ekouros_clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gga_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  name_normalized TEXT NOT NULL,
  sports_text TEXT,
  registration_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ekouros_clubs_norm ON public.ekouros_clubs(name_normalized);
CREATE INDEX idx_ekouros_clubs_code ON public.ekouros_clubs(gga_code);

-- Club ↔ Sport
CREATE TABLE public.ekouros_club_sports (
  club_id UUID NOT NULL REFERENCES public.ekouros_clubs(id) ON DELETE CASCADE,
  sport_id UUID NOT NULL REFERENCES public.ekouros_sports(id) ON DELETE CASCADE,
  PRIMARY KEY (club_id, sport_id)
);

-- Club ↔ Federation
CREATE TABLE public.ekouros_club_federations (
  club_id UUID NOT NULL REFERENCES public.ekouros_clubs(id) ON DELETE CASCADE,
  federation_id UUID NOT NULL REFERENCES public.ekouros_federations(id) ON DELETE CASCADE,
  PRIMARY KEY (club_id, federation_id)
);

-- Enable RLS
ALTER TABLE public.ekouros_sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ekouros_federations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ekouros_clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ekouros_club_sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ekouros_club_federations ENABLE ROW LEVEL SECURITY;

-- Read policies (all authenticated)
CREATE POLICY "Authenticated read sports" ON public.ekouros_sports FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read federations" ON public.ekouros_federations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read clubs" ON public.ekouros_clubs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read club_sports" ON public.ekouros_club_sports FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read club_federations" ON public.ekouros_club_federations FOR SELECT TO authenticated USING (true);

-- Write policies: admins only (using existing app_users.role pattern)
CREATE POLICY "Admins manage sports" ON public.ekouros_sports FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.app_users WHERE auth_user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.app_users WHERE auth_user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins manage federations" ON public.ekouros_federations FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.app_users WHERE auth_user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.app_users WHERE auth_user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins manage clubs" ON public.ekouros_clubs FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.app_users WHERE auth_user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.app_users WHERE auth_user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins manage club_sports" ON public.ekouros_club_sports FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.app_users WHERE auth_user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.app_users WHERE auth_user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins manage club_federations" ON public.ekouros_club_federations FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.app_users WHERE auth_user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.app_users WHERE auth_user_id = auth.uid() AND role = 'admin'));

-- updated_at trigger
CREATE TRIGGER trg_ekouros_sports_upd BEFORE UPDATE ON public.ekouros_sports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_ekouros_federations_upd BEFORE UPDATE ON public.ekouros_federations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_ekouros_clubs_upd BEFORE UPDATE ON public.ekouros_clubs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();