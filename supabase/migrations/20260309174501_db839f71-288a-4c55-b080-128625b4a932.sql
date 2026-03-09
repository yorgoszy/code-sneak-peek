ALTER TABLE public.federation_competition_registrations 
ADD COLUMN IF NOT EXISTS is_paid boolean DEFAULT false;