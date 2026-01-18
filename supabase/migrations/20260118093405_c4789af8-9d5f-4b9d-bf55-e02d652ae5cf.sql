-- Fixed helper to map auth.uid() -> app_users.id
-- auth_user_id column is UUID (not text)
CREATE OR REPLACE FUNCTION public.current_app_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT au.id
  FROM public.app_users au
  WHERE au.auth_user_id = auth.uid()
  LIMIT 1;
$$;

-- Ensure is_admin_user() checks app_users.role = 'admin' (legacy approach used in project)
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.app_users
    WHERE auth_user_id = auth.uid()
    AND role = 'admin'
  );
$$;

-- Replace strike_types RLS policies 
DROP POLICY IF EXISTS "Coaches and admins can create strike types" ON public.strike_types;
DROP POLICY IF EXISTS "Coaches and admins can update strike types" ON public.strike_types;
DROP POLICY IF EXISTS "Coaches and admins can delete strike types" ON public.strike_types;

CREATE POLICY "Coaches and admins can create strike types"
ON public.strike_types
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_admin_user()
  OR coach_id = public.current_app_user_id()
);

CREATE POLICY "Coaches and admins can update strike types"
ON public.strike_types
FOR UPDATE
TO authenticated
USING (
  public.is_admin_user()
  OR coach_id = public.current_app_user_id()
)
WITH CHECK (
  public.is_admin_user()
  OR coach_id = public.current_app_user_id()
);

CREATE POLICY "Coaches and admins can delete strike types"
ON public.strike_types
FOR DELETE
TO authenticated
USING (
  public.is_admin_user()
  OR coach_id = public.current_app_user_id()
);