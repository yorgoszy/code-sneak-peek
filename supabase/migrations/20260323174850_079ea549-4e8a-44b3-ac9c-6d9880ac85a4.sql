-- Fix workout_completions RLS: allow coaches/admins full access, keep athlete self-access

DROP POLICY IF EXISTS "Users can view their own workout completions" ON public.workout_completions;
DROP POLICY IF EXISTS "Users can create their own workout completions" ON public.workout_completions;
DROP POLICY IF EXISTS "Users can update their own workout completions" ON public.workout_completions;

-- SELECT: owner OR coach/admin
CREATE POLICY "Users can view workout completions"
ON public.workout_completions FOR SELECT TO authenticated
USING (
  public.is_coach_user(auth.uid())
  OR public.is_admin_user()
  OR user_id = public.get_app_user_id_for_programs(auth.uid())
);

-- INSERT: owner OR coach/admin
CREATE POLICY "Users can create workout completions"
ON public.workout_completions FOR INSERT TO authenticated
WITH CHECK (
  public.is_coach_user(auth.uid())
  OR public.is_admin_user()
  OR user_id = public.get_app_user_id_for_programs(auth.uid())
);

-- UPDATE: owner OR coach/admin
CREATE POLICY "Users can update workout completions"
ON public.workout_completions FOR UPDATE TO authenticated
USING (
  public.is_coach_user(auth.uid())
  OR public.is_admin_user()
  OR user_id = public.get_app_user_id_for_programs(auth.uid())
);

-- DELETE: coach/admin only
CREATE POLICY "Coaches can delete workout completions"
ON public.workout_completions FOR DELETE TO authenticated
USING (
  public.is_coach_user(auth.uid())
  OR public.is_admin_user()
);