-- Helper function to map auth user -> app_users.id
CREATE OR REPLACE FUNCTION public.current_app_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.app_users WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

-- Helper function: is admin
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

-- Replace policies with correct mapping (app_users.id vs auth.uid)
DROP POLICY IF EXISTS "Coaches and admins can create strike types" ON public.strike_types;
DROP POLICY IF EXISTS "Coaches and admins can update strike types" ON public.strike_types;
DROP POLICY IF EXISTS "Coaches and admins can delete strike types" ON public.strike_types;

CREATE POLICY "Coaches and admins can create strike types" 
ON public.strike_types 
FOR INSERT 
WITH CHECK (
  coach_id = public.current_app_user_id()
  OR public.is_admin_user()
);

CREATE POLICY "Coaches and admins can update strike types" 
ON public.strike_types 
FOR UPDATE 
USING (
  coach_id = public.current_app_user_id()
  OR public.is_admin_user()
)
WITH CHECK (
  coach_id = public.current_app_user_id()
  OR public.is_admin_user()
);

CREATE POLICY "Coaches and admins can delete strike types" 
ON public.strike_types 
FOR DELETE 
USING (
  coach_id = public.current_app_user_id()
  OR public.is_admin_user()
);