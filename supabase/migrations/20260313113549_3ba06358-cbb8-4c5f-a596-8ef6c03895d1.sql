
CREATE POLICY "Anon can view competition match athletes"
ON public.app_users
FOR SELECT
TO anon
USING (
  id IN (
    SELECT athlete1_id FROM public.competition_matches WHERE athlete1_id IS NOT NULL
    UNION
    SELECT athlete2_id FROM public.competition_matches WHERE athlete2_id IS NOT NULL
  )
);
