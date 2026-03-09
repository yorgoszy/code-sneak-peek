-- Allow federation users to see athletes registered in their competitions
CREATE POLICY "app_users_select_federation_competition_athletes"
ON public.app_users
FOR SELECT
TO authenticated
USING (
  get_user_role_safe(auth.uid()) = 'federation'
  AND id IN (
    SELECT fcr.athlete_id 
    FROM federation_competition_registrations fcr
    JOIN federation_competitions fc ON fc.id = fcr.competition_id
    WHERE fc.federation_id = get_app_user_id_safe(auth.uid())
  )
);