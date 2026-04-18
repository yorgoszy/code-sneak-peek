-- Create athlete_federations many-to-many table
CREATE TABLE public.athlete_federations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  federation_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  registration_number TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(athlete_id, federation_id)
);

CREATE INDEX idx_athlete_federations_athlete ON public.athlete_federations(athlete_id);
CREATE INDEX idx_athlete_federations_federation ON public.athlete_federations(federation_id);

ALTER TABLE public.athlete_federations ENABLE ROW LEVEL SECURITY;

-- Helper function: get federation_ids for a given app_user (athlete)
CREATE OR REPLACE FUNCTION public.get_athlete_federation_ids(_athlete_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT federation_id FROM public.athlete_federations
  WHERE athlete_id = _athlete_id AND is_active = true;
$$;

-- Helper: get athlete_ids for a federation user
CREATE OR REPLACE FUNCTION public.get_federation_athlete_ids(_federation_auth_uid uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT af.athlete_id
  FROM public.athlete_federations af
  WHERE af.is_active = true
    AND af.federation_id = (
      SELECT id FROM public.app_users
      WHERE auth_user_id = _federation_auth_uid
      LIMIT 1
    );
$$;

-- RLS Policies

-- Admins can do everything
CREATE POLICY "Admins manage all athlete_federations"
ON public.athlete_federations
FOR ALL
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- Federations can view/manage their own memberships
CREATE POLICY "Federations view own memberships"
ON public.athlete_federations
FOR SELECT
USING (
  federation_id = (SELECT id FROM public.app_users WHERE auth_user_id = auth.uid() LIMIT 1)
);

CREATE POLICY "Federations insert own memberships"
ON public.athlete_federations
FOR INSERT
WITH CHECK (
  federation_id = (SELECT id FROM public.app_users WHERE auth_user_id = auth.uid() LIMIT 1)
);

CREATE POLICY "Federations update own memberships"
ON public.athlete_federations
FOR UPDATE
USING (
  federation_id = (SELECT id FROM public.app_users WHERE auth_user_id = auth.uid() LIMIT 1)
);

CREATE POLICY "Federations delete own memberships"
ON public.athlete_federations
FOR DELETE
USING (
  federation_id = (SELECT id FROM public.app_users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- Athletes can view their own federation memberships
CREATE POLICY "Athletes view own federation memberships"
ON public.athlete_federations
FOR SELECT
USING (
  athlete_id = (SELECT id FROM public.app_users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- updated_at trigger
CREATE TRIGGER update_athlete_federations_updated_at
BEFORE UPDATE ON public.athlete_federations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();