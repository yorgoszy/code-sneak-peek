CREATE TABLE IF NOT EXISTS public.ai_competition_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  competition_id UUID REFERENCES public.federation_competitions(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  phone TEXT,
  athlete_name TEXT,
  club TEXT,
  notify_youtube BOOLEAN NOT NULL DEFAULT true,
  notify_bracket BOOLEAN NOT NULL DEFAULT true,
  notify_schedule BOOLEAN NOT NULL DEFAULT true,
  notified_youtube_at TIMESTAMPTZ,
  notified_bracket_at TIMESTAMPTZ,
  source TEXT DEFAULT 'hyper_ai',
  raw_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_competition_leads_competition_idx ON public.ai_competition_leads(competition_id);
CREATE INDEX IF NOT EXISTS ai_competition_leads_email_idx ON public.ai_competition_leads(email);

ALTER TABLE public.ai_competition_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a lead"
  ON public.ai_competition_leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view leads"
  ON public.ai_competition_leads
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.app_users au
    WHERE au.auth_user_id = auth.uid() AND au.role IN ('admin', 'federation')
  ));

CREATE POLICY "Admins can update leads"
  ON public.ai_competition_leads
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.app_users au
    WHERE au.auth_user_id = auth.uid() AND au.role IN ('admin', 'federation')
  ));