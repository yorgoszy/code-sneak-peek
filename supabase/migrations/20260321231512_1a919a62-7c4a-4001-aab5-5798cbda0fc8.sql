-- Fix FMS tables: restrict write access to coaches/admins only

-- fms_exercise_mappings: drop permissive write policies
DROP POLICY IF EXISTS "Authenticated can insert fms_exercise_mappings" ON public.fms_exercise_mappings;
DROP POLICY IF EXISTS "Authenticated can update fms_exercise_mappings" ON public.fms_exercise_mappings;
DROP POLICY IF EXISTS "Authenticated can delete fms_exercise_mappings" ON public.fms_exercise_mappings;

-- fms_exercise_alternatives: drop permissive write policies
DROP POLICY IF EXISTS "Authenticated can insert fms_exercise_alternatives" ON public.fms_exercise_alternatives;
DROP POLICY IF EXISTS "Authenticated can update fms_exercise_alternatives" ON public.fms_exercise_alternatives;
DROP POLICY IF EXISTS "Authenticated can delete fms_exercise_alternatives" ON public.fms_exercise_alternatives;

-- Create coach/admin-only write policies for fms_exercise_mappings
CREATE POLICY "Coaches manage fms_exercise_mappings"
  ON public.fms_exercise_mappings
  FOR ALL TO authenticated
  USING (public.is_coach_user(auth.uid()))
  WITH CHECK (public.is_coach_user(auth.uid()));

-- Create coach/admin-only write policies for fms_exercise_alternatives
CREATE POLICY "Coaches manage fms_exercise_alternatives"
  ON public.fms_exercise_alternatives
  FOR ALL TO authenticated
  USING (public.is_coach_user(auth.uid()))
  WITH CHECK (public.is_coach_user(auth.uid()));