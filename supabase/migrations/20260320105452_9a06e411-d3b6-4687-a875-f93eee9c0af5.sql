-- Fix the security definer view warning by recreating with security_invoker
DROP VIEW IF EXISTS public.public_competition_athletes;

CREATE VIEW public.public_competition_athletes 
WITH (security_invoker = true) AS
  SELECT au.id, au.name, au.avatar_url
  FROM public.app_users au
  WHERE au.id IN (
    SELECT cm.athlete1_id FROM public.competition_matches cm WHERE cm.athlete1_id IS NOT NULL
    UNION
    SELECT cm.athlete2_id FROM public.competition_matches cm WHERE cm.athlete2_id IS NOT NULL
  );

GRANT SELECT ON public.public_competition_athletes TO anon;
GRANT SELECT ON public.public_competition_athletes TO authenticated;