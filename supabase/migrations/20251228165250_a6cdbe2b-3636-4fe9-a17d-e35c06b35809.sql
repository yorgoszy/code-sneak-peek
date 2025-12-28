-- Fix app_users RLS infinite recursion by removing self-referential policies

-- Ensure RLS is enabled
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

-- Drop problematic/legacy policies (idempotent)
DROP POLICY IF EXISTS "Admins can view all users" ON public.app_users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.app_users;
DROP POLICY IF EXISTS "Coaches can view their users" ON public.app_users;
DROP POLICY IF EXISTS "Coaches can update their users" ON public.app_users;
DROP POLICY IF EXISTS "Coaches can insert users" ON public.app_users;
DROP POLICY IF EXISTS "Users can view app users" ON public.app_users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.app_users;
DROP POLICY IF EXISTS "Users can view their own data" ON public.app_users;
DROP POLICY IF EXISTS "Users can select own app_user" ON public.app_users;
DROP POLICY IF EXISTS "Users can update own app_user" ON public.app_users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.app_users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.app_users;
DROP POLICY IF EXISTS "Users can insert own app_user" ON public.app_users;
DROP POLICY IF EXISTS "Users can create app users" ON public.app_users;
DROP POLICY IF EXISTS "No one can delete app_users" ON public.app_users;

-- SECURITY DEFINER helper to resolve current app_users row without RLS recursion
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
  LIMIT 1
$$;

-- Basic self access
CREATE POLICY "app_users_select_own"
ON public.app_users
FOR SELECT
TO authenticated
USING (auth_user_id = auth.uid());

CREATE POLICY "app_users_insert_own"
ON public.app_users
FOR INSERT
TO authenticated
WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "app_users_update_own"
ON public.app_users
FOR UPDATE
TO authenticated
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());

-- Coach access (coach can see users where they are the coach)
CREATE POLICY "app_users_select_coach_users"
ON public.app_users
FOR SELECT
TO authenticated
USING (coach_id = public.current_app_user_id());

-- Admin access via user_roles table + has_role() (assumed to exist)
CREATE POLICY "app_users_admin_all"
ON public.app_users
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Disallow deletes for everyone (including admins via app logic; DB safety)
CREATE POLICY "app_users_no_delete"
ON public.app_users
FOR DELETE
TO authenticated
USING (false);
