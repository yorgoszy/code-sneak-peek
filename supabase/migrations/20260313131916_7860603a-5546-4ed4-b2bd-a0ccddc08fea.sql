
-- Table to track all weigh-in attempts for competition registrations
CREATE TABLE public.competition_weigh_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES public.federation_competition_registrations(id) ON DELETE CASCADE,
  competition_id UUID NOT NULL REFERENCES public.federation_competitions(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.federation_competition_categories(id) ON DELETE CASCADE,
  declared_weight NUMERIC(5,2),
  actual_weight NUMERIC(5,2),
  doctor_approved BOOLEAN DEFAULT false,
  weigh_in_approved BOOLEAN DEFAULT false,
  rejection_reason TEXT,
  notes TEXT,
  approved_by UUID REFERENCES public.app_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_competition_weigh_ins_registration ON public.competition_weigh_ins(registration_id);
CREATE INDEX idx_competition_weigh_ins_competition ON public.competition_weigh_ins(competition_id);
CREATE INDEX idx_competition_weigh_ins_athlete ON public.competition_weigh_ins(athlete_id);

-- Enable RLS
ALTER TABLE public.competition_weigh_ins ENABLE ROW LEVEL SECURITY;

-- Federation users can manage weigh-ins for their competitions
CREATE POLICY "federation_manage_weigh_ins" ON public.competition_weigh_ins
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.federation_competitions fc
      WHERE fc.id = competition_weigh_ins.competition_id
        AND fc.federation_id = (SELECT id FROM public.app_users WHERE auth_user_id = auth.uid() LIMIT 1)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.federation_competitions fc
      WHERE fc.id = competition_weigh_ins.competition_id
        AND fc.federation_id = (SELECT id FROM public.app_users WHERE auth_user_id = auth.uid() LIMIT 1)
    )
  );

-- Coaches can view weigh-ins for their athletes
CREATE POLICY "coach_view_weigh_ins" ON public.competition_weigh_ins
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.app_users au
      WHERE au.id = competition_weigh_ins.athlete_id
        AND au.coach_id = (SELECT id FROM public.app_users WHERE auth_user_id = auth.uid() LIMIT 1)
    )
  );

-- Athletes can view their own weigh-ins
CREATE POLICY "athlete_view_own_weigh_ins" ON public.competition_weigh_ins
  FOR SELECT TO authenticated
  USING (
    athlete_id = (SELECT id FROM public.app_users WHERE auth_user_id = auth.uid() LIMIT 1)
  );

-- Admin full access
CREATE POLICY "admin_manage_weigh_ins" ON public.competition_weigh_ins
  FOR ALL TO authenticated
  USING (public.is_admin_safe(auth.uid()))
  WITH CHECK (public.is_admin_safe(auth.uid()));

-- Updated_at trigger
CREATE TRIGGER update_competition_weigh_ins_updated_at
  BEFORE UPDATE ON public.competition_weigh_ins
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
