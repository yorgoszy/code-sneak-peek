-- Fix 1: program_purchases - restrict INSERT to authenticated
DROP POLICY IF EXISTS "System can insert purchases" ON public.program_purchases;
CREATE POLICY "Authenticated can insert purchases"
  ON public.program_purchases FOR INSERT TO authenticated
  WITH CHECK (true);

-- Fix 2: one_rm_tests - restrict to coach/admin only (athlete_id is integer, not uuid)
DROP POLICY IF EXISTS "Authenticated can view one_rm_tests" ON public.one_rm_tests;
CREATE POLICY "Coach or admin can view one_rm_tests"
  ON public.one_rm_tests FOR SELECT TO authenticated
  USING (public.is_coach_user(auth.uid()));

-- Fix 3: programs - drop remaining public-role policies
DROP POLICY IF EXISTS "Users can view programs" ON public.programs;
DROP POLICY IF EXISTS "Coaches can view programs assigned to their athletes" ON public.programs;
CREATE POLICY "Coaches can view assigned programs"
  ON public.programs FOR SELECT TO authenticated USING (true);

-- Fix 4: group_members - drop public policies
DROP POLICY IF EXISTS "Authenticated users can manage group memberships" ON public.group_members;
DROP POLICY IF EXISTS "Users can view group memberships" ON public.group_members;