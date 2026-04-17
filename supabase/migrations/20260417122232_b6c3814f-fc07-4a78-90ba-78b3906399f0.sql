-- Πίνακας για leads από το landing chatbot
CREATE TABLE public.landing_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  message TEXT,
  interest TEXT,
  session_id TEXT,
  language TEXT DEFAULT 'el',
  user_agent TEXT,
  notified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.landing_leads ENABLE ROW LEVEL SECURITY;

-- Public insert (από landing chatbot, χωρίς auth)
CREATE POLICY "Anyone can submit a lead"
  ON public.landing_leads
  FOR INSERT
  WITH CHECK (true);

-- Μόνο admins μπορούν να δουν τα leads
CREATE POLICY "Admins can view leads"
  ON public.landing_leads
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.app_users
      WHERE app_users.auth_user_id = auth.uid()
        AND app_users.role IN ('admin', 'coach')
    )
  );

CREATE INDEX idx_landing_leads_created_at ON public.landing_leads(created_at DESC);