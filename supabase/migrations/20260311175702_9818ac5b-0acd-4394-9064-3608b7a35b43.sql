
-- Allow coaches to see athletes who are in competitions of their federation
CREATE POLICY "app_users_select_coach_competition_athletes"
ON public.app_users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM federation_competition_registrations fcr
    JOIN federation_competitions fc ON fc.id = fcr.competition_id
    JOIN federation_clubs fclub ON fclub.federation_id = fc.federation_id
    WHERE fcr.athlete_id = app_users.id
      AND fclub.club_id = (
        SELECT au.id FROM app_users au WHERE au.auth_user_id = auth.uid() AND au.role = 'coach' LIMIT 1
      )
  )
);
