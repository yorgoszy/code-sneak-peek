-- Fix: Drop overly permissive public RLS policies and replace with authenticated-scoped policies

-- 1. saved_macrocycles
DROP POLICY IF EXISTS "Allow all operations on saved_macrocycles" ON public.saved_macrocycles;
CREATE POLICY "Authenticated users can manage saved_macrocycles"
  ON public.saved_macrocycles FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. assignment_attendance
DROP POLICY IF EXISTS "System can manage attendance" ON public.assignment_attendance;
CREATE POLICY "Authenticated can manage attendance"
  ON public.assignment_attendance FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. training_type_stats
DROP POLICY IF EXISTS "Service role can manage all training stats" ON public.training_type_stats;
CREATE POLICY "Authenticated service can manage training stats"
  ON public.training_type_stats FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. test_sessions - drop 3 public true policies (keep auth.uid() scoped ones)
DROP POLICY IF EXISTS "Allow access to test_sessions for all" ON public.test_sessions;
DROP POLICY IF EXISTS "Allow insert to test_sessions for all" ON public.test_sessions;
DROP POLICY IF EXISTS "Allow update to test_sessions for all" ON public.test_sessions;

-- 5. block_templates
DROP POLICY IF EXISTS "Users can create block templates" ON public.block_templates;
DROP POLICY IF EXISTS "Users can delete their own block templates" ON public.block_templates;
DROP POLICY IF EXISTS "Users can update their own block templates" ON public.block_templates;
DROP POLICY IF EXISTS "Users can view all block templates" ON public.block_templates;
CREATE POLICY "Authenticated can view block templates" ON public.block_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can create block templates" ON public.block_templates FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update block templates" ON public.block_templates FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete block templates" ON public.block_templates FOR DELETE TO authenticated USING (true);

-- 6. fms_exercise_mappings
DROP POLICY IF EXISTS "Users can delete fms_exercise_mappings" ON public.fms_exercise_mappings;
DROP POLICY IF EXISTS "Users can insert fms_exercise_mappings" ON public.fms_exercise_mappings;
DROP POLICY IF EXISTS "Users can update fms_exercise_mappings" ON public.fms_exercise_mappings;
DROP POLICY IF EXISTS "Users can view all fms_exercise_mappings" ON public.fms_exercise_mappings;
CREATE POLICY "Authenticated can view fms_exercise_mappings" ON public.fms_exercise_mappings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert fms_exercise_mappings" ON public.fms_exercise_mappings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update fms_exercise_mappings" ON public.fms_exercise_mappings FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete fms_exercise_mappings" ON public.fms_exercise_mappings FOR DELETE TO authenticated USING (true);

-- 7. fms_exercise_alternatives
DROP POLICY IF EXISTS "Authenticated users can delete FMS exercise alternatives" ON public.fms_exercise_alternatives;
DROP POLICY IF EXISTS "Authenticated users can insert FMS exercise alternatives" ON public.fms_exercise_alternatives;
DROP POLICY IF EXISTS "Authenticated users can update FMS exercise alternatives" ON public.fms_exercise_alternatives;
DROP POLICY IF EXISTS "Everyone can view FMS exercise alternatives" ON public.fms_exercise_alternatives;
CREATE POLICY "Authenticated can view fms_exercise_alternatives" ON public.fms_exercise_alternatives FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert fms_exercise_alternatives" ON public.fms_exercise_alternatives FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update fms_exercise_alternatives" ON public.fms_exercise_alternatives FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete fms_exercise_alternatives" ON public.fms_exercise_alternatives FOR DELETE TO authenticated USING (true);

-- 8. functional_muscle_exercises
DROP POLICY IF EXISTS "Admins can manage functional muscle exercises" ON public.functional_muscle_exercises;
DROP POLICY IF EXISTS "Everyone can view functional muscle exercises" ON public.functional_muscle_exercises;
CREATE POLICY "Authenticated can view functional_muscle_exercises" ON public.functional_muscle_exercises FOR SELECT TO authenticated USING (true);
CREATE POLICY "Coaches can manage functional_muscle_exercises" ON public.functional_muscle_exercises FOR ALL TO authenticated USING (public.is_coach_user(auth.uid())) WITH CHECK (public.is_coach_user(auth.uid()));

-- 9. one_rm_tests
DROP POLICY IF EXISTS "Users can view their own one_rm_tests" ON public.one_rm_tests;
CREATE POLICY "Authenticated can view one_rm_tests" ON public.one_rm_tests FOR SELECT TO authenticated USING (true);

-- 10. mas_tests
DROP POLICY IF EXISTS "Users can view their own mas_tests" ON public.mas_tests;
CREATE POLICY "Authenticated can view mas_tests" ON public.mas_tests FOR SELECT TO authenticated USING (true);