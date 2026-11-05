CREATE TABLE public.coach_mydata_credentials (
  coach_id uuid PRIMARY KEY REFERENCES public.coach_mydata_settings(coach_id) ON DELETE CASCADE,
  aade_user_id text NOT NULL DEFAULT '',
  subscription_key text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coach_mydata_credentials TO authenticated;
GRANT ALL ON public.coach_mydata_credentials TO service_role;
ALTER TABLE public.coach_mydata_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin manages coach mydata credentials" ON public.coach_mydata_credentials FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::user_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::user_role));
ALTER TABLE public.coach_mydata_settings ADD COLUMN IF NOT EXISTS auto_send boolean NOT NULL DEFAULT false;