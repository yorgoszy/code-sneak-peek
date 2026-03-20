-- Drop the overly permissive anon policy that exposes full app_users rows
DROP POLICY IF EXISTS "Anon can view competition match athletes" ON public.app_users;

-- Create a restricted view that only exposes id, name, and avatar_url for competition athletes
CREATE OR REPLACE VIEW public.public_competition_athletes AS
  SELECT au.id, au.name, au.avatar_url
  FROM public.app_users au
  WHERE au.id IN (
    SELECT cm.athlete1_id FROM public.competition_matches cm WHERE cm.athlete1_id IS NOT NULL
    UNION
    SELECT cm.athlete2_id FROM public.competition_matches cm WHERE cm.athlete2_id IS NOT NULL
  );

-- Grant anon access to the view only
GRANT SELECT ON public.public_competition_athletes TO anon;
GRANT SELECT ON public.public_competition_athletes TO authenticated;