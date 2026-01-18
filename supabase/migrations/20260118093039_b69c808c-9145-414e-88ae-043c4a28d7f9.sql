-- Fix RLS policies using is_admin_user() which already exists and works
DROP POLICY IF EXISTS "Coaches and admins can create strike types" ON public.strike_types;
DROP POLICY IF EXISTS "Coaches and admins can update strike types" ON public.strike_types;
DROP POLICY IF EXISTS "Coaches and admins can delete strike types" ON public.strike_types;

-- Recreate with simpler logic using existing is_admin_user()
CREATE POLICY "Coaches and admins can create strike types"
ON public.strike_types
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_admin_user() = true
  OR coach_id IN (SELECT id FROM public.app_users WHERE auth_user_id = auth.uid())
);

CREATE POLICY "Coaches and admins can update strike types"
ON public.strike_types
FOR UPDATE
TO authenticated
USING (
  public.is_admin_user() = true
  OR coach_id IN (SELECT id FROM public.app_users WHERE auth_user_id = auth.uid())
)
WITH CHECK (
  public.is_admin_user() = true
  OR coach_id IN (SELECT id FROM public.app_users WHERE auth_user_id = auth.uid())
);

CREATE POLICY "Coaches and admins can delete strike types"
ON public.strike_types
FOR DELETE
TO authenticated
USING (
  public.is_admin_user() = true
  OR coach_id IN (SELECT id FROM public.app_users WHERE auth_user_id = auth.uid())
);