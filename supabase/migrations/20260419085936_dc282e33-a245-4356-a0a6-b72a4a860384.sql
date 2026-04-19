
-- Πίνακας καταγγελιών κακοποίησης
CREATE TABLE public.abuse_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES public.app_users(id) ON DELETE SET NULL,
  abuse_types TEXT[] NOT NULL DEFAULT '{}',
  description TEXT NOT NULL,
  incident_date DATE,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','investigating','resolved','dismissed')),
  admin_notes TEXT,
  notified_federation_ids UUID[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_abuse_reports_athlete ON public.abuse_reports(athlete_id);
CREATE INDEX idx_abuse_reports_coach ON public.abuse_reports(coach_id);
CREATE INDEX idx_abuse_reports_status ON public.abuse_reports(status);

ALTER TABLE public.abuse_reports ENABLE ROW LEVEL SECURITY;

-- Helper: είναι ο τρέχων χρήστης ο αθλητής της καταγγελίας;
CREATE OR REPLACE FUNCTION public.is_report_owner(_athlete_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.app_users
    WHERE id = _athlete_id AND auth_user_id = auth.uid()
  )
$$;

-- Helper: είναι ο τρέχων χρήστης admin;
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.app_users
    WHERE auth_user_id = auth.uid() AND role = 'admin'
  )
$$;

-- Helper: είναι ο τρέχων χρήστης ομοσπονδία που έχει τον coach της καταγγελίας;
CREATE OR REPLACE FUNCTION public.is_federation_for_coach(_coach_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.federation_clubs fc
    JOIN public.app_users u ON u.id = fc.federation_id
    WHERE fc.club_id = _coach_id AND u.auth_user_id = auth.uid()
  )
$$;

-- Policies
CREATE POLICY "Athlete can create own report"
  ON public.abuse_reports FOR INSERT
  WITH CHECK (public.is_report_owner(athlete_id));

CREATE POLICY "Athlete can view own reports"
  ON public.abuse_reports FOR SELECT
  USING (public.is_report_owner(athlete_id));

CREATE POLICY "Admin can view all reports"
  ON public.abuse_reports FOR SELECT
  USING (public.is_current_user_admin());

CREATE POLICY "Admin can update reports"
  ON public.abuse_reports FOR UPDATE
  USING (public.is_current_user_admin());

CREATE POLICY "Federation can view reports about their coaches"
  ON public.abuse_reports FOR SELECT
  USING (
    coach_id IS NOT NULL
    AND public.is_federation_for_coach(coach_id)
    AND (auth.jwt() IS NOT NULL)
  );

-- Trigger για updated_at
CREATE TRIGGER update_abuse_reports_updated_at
  BEFORE UPDATE ON public.abuse_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
