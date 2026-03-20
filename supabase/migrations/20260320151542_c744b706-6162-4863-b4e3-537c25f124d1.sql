-- Fix programs table: replace permissive USING(true) policies with owner-scoped ones

-- Helper function to get app_user_id safely (if not already present)
CREATE OR REPLACE FUNCTION public.get_app_user_id_for_programs(_auth_uid uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT id FROM public.app_users WHERE auth_user_id = _auth_uid LIMIT 1;
$$;

-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Users can create programs" ON public.programs;
DROP POLICY IF EXISTS "Users can update programs" ON public.programs;
DROP POLICY IF EXISTS "Users can delete programs" ON public.programs;

-- Coaches/admins can create programs (bind created_by to caller)
CREATE POLICY "Coaches can create programs" ON public.programs
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_coach_user(auth.uid())
    AND (created_by = public.get_app_user_id_for_programs(auth.uid()) OR public.is_coach_user(auth.uid()))
  );

-- Only the creator or admin can update programs
CREATE POLICY "Owner or admin can update programs" ON public.programs
  FOR UPDATE TO authenticated
  USING (
    created_by = public.get_app_user_id_for_programs(auth.uid())
    OR coach_id = public.get_app_user_id_for_programs(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.app_users
      WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );

-- Only the creator or admin can delete programs
CREATE POLICY "Owner or admin can delete programs" ON public.programs
  FOR DELETE TO authenticated
  USING (
    created_by = public.get_app_user_id_for_programs(auth.uid())
    OR coach_id = public.get_app_user_id_for_programs(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.app_users
      WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );