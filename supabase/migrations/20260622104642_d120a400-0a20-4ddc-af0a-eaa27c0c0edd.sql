
CREATE TABLE public.trial_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  section_id UUID REFERENCES public.booking_sections(id) ON DELETE SET NULL,
  preferred_date DATE,
  preferred_time TIME,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_response TEXT,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.trial_requests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trial_requests TO authenticated;
GRANT ALL ON public.trial_requests TO service_role;

ALTER TABLE public.trial_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create trial request"
  ON public.trial_requests FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can read by id"
  ON public.trial_requests FOR SELECT
  USING (true);

CREATE POLICY "Admins can update trial requests"
  ON public.trial_requests FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete trial requests"
  ON public.trial_requests FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_trial_requests_updated_at
  BEFORE UPDATE ON public.trial_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
