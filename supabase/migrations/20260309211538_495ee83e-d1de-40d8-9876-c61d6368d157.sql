
CREATE TABLE public.federation_saved_venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  federation_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(federation_id, name)
);

ALTER TABLE public.federation_saved_venues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Federations can manage own venues"
  ON public.federation_saved_venues
  FOR ALL
  TO authenticated
  USING (
    federation_id = (SELECT id FROM public.app_users WHERE auth_user_id = auth.uid() LIMIT 1)
  )
  WITH CHECK (
    federation_id = (SELECT id FROM public.app_users WHERE auth_user_id = auth.uid() LIMIT 1)
  );
