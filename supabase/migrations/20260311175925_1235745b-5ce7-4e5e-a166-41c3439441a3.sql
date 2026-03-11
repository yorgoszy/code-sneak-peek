
-- Drop the problematic policy
DROP POLICY IF EXISTS "app_users_select_coach_competition_athletes" ON public.app_users;

-- Create a security definer function to avoid recursion
CREATE OR REPLACE FUNCTION public.is_coach_competition_athlete(_user_auth_id uuid, _athlete_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM federation_competition_registrations fcr
    JOIN federation_competitions fc ON fc.id = fcr.competition_id
    JOIN federation_clubs fclub ON fclub.federation_id = fc.federation_id
    WHERE fcr.athlete_id = _athlete_id
      AND fclub.club_id = (
        SELECT au.id FROM app_users au WHERE au.auth_user_id = _user_auth_id AND au.role = 'coach' LIMIT 1
      )
  )
$$;

-- Recreate policy using the function
CREATE POLICY "app_users_select_coach_competition_athletes"
ON public.app_users
FOR SELECT
TO authenticated
USING (
  public.is_coach_competition_athlete(auth.uid(), id)
);
