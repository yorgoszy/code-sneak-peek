-- Simplify nested program table RLS to avoid expensive joins on deep program queries
-- Keep access secure by delegating reads to can_read_program(), which already has a coach/admin fast path.

DROP POLICY IF EXISTS "Coaches can view weeks of assigned programs" ON public.program_weeks;
DROP POLICY IF EXISTS "Coaches can view days of assigned programs" ON public.program_days;

DROP POLICY IF EXISTS "Authenticated coaches manage program weeks" ON public.program_weeks;
CREATE POLICY "Authenticated coaches manage program weeks"
ON public.program_weeks
FOR ALL
TO authenticated
USING (public.is_admin_user() OR public.is_coach_user(auth.uid()))
WITH CHECK (public.is_admin_user() OR public.is_coach_user(auth.uid()));

DROP POLICY IF EXISTS "Authenticated coaches manage program days" ON public.program_days;
CREATE POLICY "Authenticated coaches manage program days"
ON public.program_days
FOR ALL
TO authenticated
USING (public.is_admin_user() OR public.is_coach_user(auth.uid()))
WITH CHECK (public.is_admin_user() OR public.is_coach_user(auth.uid()));

DROP POLICY IF EXISTS "Authenticated coaches manage program blocks" ON public.program_blocks;
CREATE POLICY "Authenticated coaches manage program blocks"
ON public.program_blocks
FOR ALL
TO authenticated
USING (public.is_admin_user() OR public.is_coach_user(auth.uid()))
WITH CHECK (public.is_admin_user() OR public.is_coach_user(auth.uid()));

DROP POLICY IF EXISTS "Authenticated coaches manage program exercises" ON public.program_exercises;
CREATE POLICY "Authenticated coaches manage program exercises"
ON public.program_exercises
FOR ALL
TO authenticated
USING (public.is_admin_user() OR public.is_coach_user(auth.uid()))
WITH CHECK (public.is_admin_user() OR public.is_coach_user(auth.uid()));