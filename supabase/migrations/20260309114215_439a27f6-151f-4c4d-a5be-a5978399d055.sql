
-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "app_users_select_federation_competition_athletes" ON public.app_users;

-- Create a SECURITY DEFINER function to check federation athlete access
CREATE OR REPLACE FUNCTION public.is_federation_competition_athlete(_user_auth_id uuid, _athlete_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM federation_competition_registrations fcr
    JOIN federation_competitions fc ON fc.id = fcr.competition_id
    WHERE fcr.athlete_id = _athlete_id
      AND fc.federation_id = (
        SELECT id FROM app_users WHERE auth_user_id = _user_auth_id LIMIT 1
      )
  )
$$;

-- Recreate the policy using the SECURITY DEFINER function
CREATE POLICY "app_users_select_federation_competition_athletes"
  ON public.app_users
  FOR SELECT
  USING (
    get_user_role_safe(auth.uid()) = 'federation'
    AND is_federation_competition_athlete(auth.uid(), id)
  );

-- Also fix federation_competition_registrations policies that reference app_users directly
DROP POLICY IF EXISTS "Clubs manage own registrations" ON public.federation_competition_registrations;
DROP POLICY IF EXISTS "Federations update registrations" ON public.federation_competition_registrations;
DROP POLICY IF EXISTS "Federations view all registrations" ON public.federation_competition_registrations;

-- Recreate using safe functions
CREATE POLICY "Clubs manage own registrations"
  ON public.federation_competition_registrations
  FOR ALL
  USING (club_id = get_app_user_id_safe(auth.uid()));

CREATE POLICY "Federations view all registrations"
  ON public.federation_competition_registrations
  FOR SELECT
  USING (
    competition_id IN (
      SELECT fc.id FROM federation_competitions fc
      WHERE fc.federation_id = get_app_user_id_safe(auth.uid())
    )
  );

CREATE POLICY "Federations update registrations"
  ON public.federation_competition_registrations
  FOR UPDATE
  USING (
    competition_id IN (
      SELECT fc.id FROM federation_competitions fc
      WHERE fc.federation_id = get_app_user_id_safe(auth.uid())
    )
  );

-- Fix federation_competitions policies too
DROP POLICY IF EXISTS "Federations manage own competitions" ON public.federation_competitions;
DROP POLICY IF EXISTS "Coaches view federation competitions" ON public.federation_competitions;

CREATE POLICY "Federations manage own competitions"
  ON public.federation_competitions
  FOR ALL
  USING (federation_id = get_app_user_id_safe(auth.uid()));

CREATE POLICY "Coaches view federation competitions"
  ON public.federation_competitions
  FOR SELECT
  USING (
    federation_id IN (
      SELECT fc.federation_id FROM federation_clubs fc
      WHERE fc.club_id = get_app_user_id_safe(auth.uid())
    )
  );
