-- Fix infinite recursion on app_users RLS by using policies that do NOT reference app_users

-- Drop current app_users policies
DROP POLICY IF EXISTS "app_users_select_policy" ON public.app_users;
DROP POLICY IF EXISTS "app_users_insert_policy" ON public.app_users;
DROP POLICY IF EXISTS "app_users_update_policy" ON public.app_users;
DROP POLICY IF EXISTS "app_users_delete_policy" ON public.app_users;

-- Also drop any remaining legacy policies on app_users
DROP POLICY IF EXISTS "Users can view own profile and admins can view all" ON public.app_users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.app_users;
DROP POLICY IF EXISTS "Users can update own profile and admins can update all" ON public.app_users;
DROP POLICY IF EXISTS "Only admins can delete users" ON public.app_users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.app_users;
DROP POLICY IF EXISTS "Anyone can view users" ON public.app_users;
DROP POLICY IF EXISTS "Admins can manage users" ON public.app_users;

-- Ensure RLS enabled (no-op if already)
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

-- Minimal safe policies: user can access only their own row by auth_user_id.
-- Admin access will be handled by backend/service operations (and later via proper roles table without recursion).
CREATE POLICY "Users can select own app_user" ON public.app_users
FOR SELECT
TO authenticated
USING (auth_user_id = auth.uid());

CREATE POLICY "Users can insert own app_user" ON public.app_users
FOR INSERT
TO authenticated
WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "Users can update own app_user" ON public.app_users
FOR UPDATE
TO authenticated
USING (auth_user_id = auth.uid());

-- Optional: allow users to update only their row; WITH CHECK is not required for UPDATE but keeps intent clear
-- (we avoid adding it to minimize scope).

CREATE POLICY "No one can delete app_users" ON public.app_users
FOR DELETE
TO authenticated
USING (false);
