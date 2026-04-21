-- Public view exposing only id, name, sport, role for clubs/coaches/federations
CREATE OR REPLACE VIEW public.public_clubs_directory
WITH (security_invoker=off) AS
  SELECT id, name, sport, role
  FROM public.app_users
  WHERE role IN ('admin', 'coach', 'trainer', 'federation');

GRANT SELECT ON public.public_clubs_directory TO anon, authenticated;