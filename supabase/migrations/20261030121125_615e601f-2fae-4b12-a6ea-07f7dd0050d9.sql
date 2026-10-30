CREATE OR REPLACE FUNCTION public.is_coach_safe(user_auth_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.app_users 
    WHERE auth_user_id = user_auth_id AND role IN ('coach', 'club')
  );
$$;