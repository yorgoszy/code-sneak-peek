-- Optimize can_read_program to short-circuit for coaches and avoid repeated get_app_user_id calls
CREATE OR REPLACE FUNCTION public.can_read_program(_program_id uuid, _auth_uid uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _app_user_id uuid;
BEGIN
  -- Fast path: coaches/admins can read all programs
  IF public.is_coach_user(_auth_uid) THEN
    RETURN true;
  END IF;

  -- Get app_user_id once (instead of 3x)
  _app_user_id := public.get_app_user_id_for_programs(_auth_uid);

  RETURN EXISTS (
    SELECT 1 FROM public.programs p
    WHERE p.id = _program_id
      AND (
        p.created_by = _app_user_id
        OR p.coach_id = _app_user_id
        OR p.is_template = true
        OR p.is_sellable = true
        OR EXISTS (
          SELECT 1 FROM public.program_assignments pa
          WHERE pa.program_id = p.id
            AND pa.user_id = _app_user_id
        )
      )
  );
END;
$$;

-- Optimize programs SELECT policy to call get_app_user_id_for_programs once
DROP POLICY IF EXISTS "Users can read accessible programs" ON public.programs;

CREATE POLICY "Users can read accessible programs"
  ON public.programs FOR SELECT TO authenticated
  USING (
    is_coach_user(auth.uid())
    OR is_template = true
    OR is_sellable = true
    OR created_by = public.get_app_user_id_for_programs(auth.uid())
    OR coach_id = public.get_app_user_id_for_programs(auth.uid())
    OR id IN (
      SELECT pa.program_id FROM public.program_assignments pa
      WHERE pa.user_id = public.get_app_user_id_for_programs(auth.uid())
    )
  );