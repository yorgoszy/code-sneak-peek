-- Fix infinite recursion in RLS policies for public.app_users
-- Root cause: policies referenced app_users inside subqueries which triggers recursion.

-- Drop problematic coach policies
DROP POLICY IF EXISTS "app_users_select_coach_assigned_users" ON public.app_users;
DROP POLICY IF EXISTS "app_users_update_coach_assigned_users" ON public.app_users;
DROP POLICY IF EXISTS "app_users_insert_coach_new_users" ON public.app_users;
DROP POLICY IF EXISTS "app_users_select_coach_users" ON public.app_users;

-- Recreate coach policies using SECURITY DEFINER helper functions (no recursion)
CREATE POLICY "app_users_select_coach_assigned_users"
ON public.app_users
FOR SELECT
TO authenticated
USING (
  public.is_coach_safe(auth.uid())
  AND coach_id = public.get_app_user_id_safe(auth.uid())
);

CREATE POLICY "app_users_update_coach_assigned_users"
ON public.app_users
FOR UPDATE
TO authenticated
USING (
  public.is_coach_safe(auth.uid())
  AND coach_id = public.get_app_user_id_safe(auth.uid())
)
WITH CHECK (
  public.is_coach_safe(auth.uid())
  AND coach_id = public.get_app_user_id_safe(auth.uid())
);

CREATE POLICY "app_users_insert_coach_new_users"
ON public.app_users
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_coach_safe(auth.uid())
  AND coach_id = public.get_app_user_id_safe(auth.uid())
);
