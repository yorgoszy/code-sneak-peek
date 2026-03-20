
-- 1. assignment_attendance: drop broad policy, add coach/admin
DROP POLICY IF EXISTS "Authenticated can manage attendance" ON public.assignment_attendance;
CREATE POLICY "Coaches and admins can manage attendance"
  ON public.assignment_attendance FOR ALL TO authenticated
  USING (public.is_coach_user(auth.uid()))
  WITH CHECK (public.is_coach_user(auth.uid()));

-- 2. functional_test_data: drop 4 broad policies, add coach/admin
DROP POLICY IF EXISTS "Allow authenticated users to select functional_test_data" ON public.functional_test_data;
DROP POLICY IF EXISTS "Allow authenticated users to insert functional_test_data" ON public.functional_test_data;
DROP POLICY IF EXISTS "Allow authenticated users to update functional_test_data" ON public.functional_test_data;
DROP POLICY IF EXISTS "Allow authenticated users to delete functional_test_data" ON public.functional_test_data;
CREATE POLICY "Coaches and admins can manage functional_test_data"
  ON public.functional_test_data FOR ALL TO authenticated
  USING (public.is_coach_user(auth.uid()))
  WITH CHECK (public.is_coach_user(auth.uid()));

-- 3. functional_test_sessions: drop 4 broad policies, add coach/admin
DROP POLICY IF EXISTS "Allow authenticated users to select functional_test_sessions" ON public.functional_test_sessions;
DROP POLICY IF EXISTS "Allow authenticated users to insert functional_test_sessions" ON public.functional_test_sessions;
DROP POLICY IF EXISTS "Allow authenticated users to update functional_test_sessions" ON public.functional_test_sessions;
DROP POLICY IF EXISTS "Allow authenticated users to delete functional_test_sessions" ON public.functional_test_sessions;
CREATE POLICY "Coaches and admins can manage functional_test_sessions"
  ON public.functional_test_sessions FOR ALL TO authenticated
  USING (public.is_coach_user(auth.uid()))
  WITH CHECK (public.is_coach_user(auth.uid()));

-- 4. training_type_stats: drop broad policy (owner+admin scoped ones exist)
DROP POLICY IF EXISTS "Authenticated service can manage training stats" ON public.training_type_stats;

-- 5. saved_macrocycles: scope to coach/admin
DROP POLICY IF EXISTS "Authenticated users can manage saved_macrocycles" ON public.saved_macrocycles;
CREATE POLICY "Coaches and admins can manage saved_macrocycles"
  ON public.saved_macrocycles FOR ALL TO authenticated
  USING (public.is_coach_user(auth.uid()))
  WITH CHECK (public.is_coach_user(auth.uid()));

-- 6. block_templates: drop 4 broad policies, add read for all + manage for coach/admin
DROP POLICY IF EXISTS "Authenticated can create block templates" ON public.block_templates;
DROP POLICY IF EXISTS "Authenticated can delete block templates" ON public.block_templates;
DROP POLICY IF EXISTS "Authenticated can update block templates" ON public.block_templates;
DROP POLICY IF EXISTS "Authenticated can view block templates" ON public.block_templates;
CREATE POLICY "Authenticated can view block templates"
  ON public.block_templates FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "Coaches and admins can manage block templates"
  ON public.block_templates FOR ALL TO authenticated
  USING (public.is_coach_user(auth.uid()))
  WITH CHECK (public.is_coach_user(auth.uid()));
