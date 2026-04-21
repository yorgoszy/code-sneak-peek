DROP VIEW IF EXISTS public.public_clubs_directory;

CREATE OR REPLACE FUNCTION public.get_public_clubs_directory()
RETURNS TABLE(id uuid, name text, sport text, role text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, name, sport, role
  FROM public.app_users
  WHERE role IN ('admin', 'coach', 'trainer', 'federation')
  ORDER BY name;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_clubs_directory() TO anon, authenticated;