
-- Allow federations to see all athletes of their linked clubs
-- Use SECURITY DEFINER function to avoid RLS recursion

CREATE OR REPLACE FUNCTION public.is_federation_club_athlete(_user_auth_id uuid, _athlete_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM app_users athlete
    JOIN federation_clubs fc ON fc.club_id = athlete.coach_id
    WHERE athlete.id = _athlete_id
      AND fc.federation_id = (
        SELECT id FROM app_users WHERE auth_user_id = _user_auth_id LIMIT 1
      )
  )
$$;

-- New policy: federations can see all athletes of linked clubs
CREATE POLICY "app_users_select_federation_club_athletes"
  ON public.app_users
  FOR SELECT
  USING (
    get_user_role_safe(auth.uid()) = 'federation'
    AND is_federation_club_athlete(auth.uid(), id)
  );
