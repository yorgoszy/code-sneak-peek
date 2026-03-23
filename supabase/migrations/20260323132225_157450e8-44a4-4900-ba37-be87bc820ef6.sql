-- Fix permissive write policies on stretches, exercise_stretches, exercise_relationships
-- Restrict INSERT/UPDATE/DELETE to coaches/admins only

-- ===== STRETCHES =====
DROP POLICY IF EXISTS "Authenticated users can insert stretches" ON stretches;
DROP POLICY IF EXISTS "Authenticated users can update stretches" ON stretches;
DROP POLICY IF EXISTS "Authenticated users can delete stretches" ON stretches;

CREATE POLICY "Coaches can insert stretches" ON stretches
  FOR INSERT TO authenticated
  WITH CHECK (public.is_coach_user(auth.uid()));

CREATE POLICY "Coaches can update stretches" ON stretches
  FOR UPDATE TO authenticated
  USING (public.is_coach_user(auth.uid()))
  WITH CHECK (public.is_coach_user(auth.uid()));

CREATE POLICY "Coaches can delete stretches" ON stretches
  FOR DELETE TO authenticated
  USING (public.is_coach_user(auth.uid()));

-- ===== EXERCISE_STRETCHES =====
DROP POLICY IF EXISTS "Authenticated users can insert exercise_stretches" ON exercise_stretches;
DROP POLICY IF EXISTS "Authenticated users can update exercise_stretches" ON exercise_stretches;
DROP POLICY IF EXISTS "Authenticated users can delete exercise_stretches" ON exercise_stretches;

CREATE POLICY "Coaches can insert exercise_stretches" ON exercise_stretches
  FOR INSERT TO authenticated
  WITH CHECK (public.is_coach_user(auth.uid()));

CREATE POLICY "Coaches can update exercise_stretches" ON exercise_stretches
  FOR UPDATE TO authenticated
  USING (public.is_coach_user(auth.uid()))
  WITH CHECK (public.is_coach_user(auth.uid()));

CREATE POLICY "Coaches can delete exercise_stretches" ON exercise_stretches
  FOR DELETE TO authenticated
  USING (public.is_coach_user(auth.uid()));

-- ===== EXERCISE_RELATIONSHIPS =====
DROP POLICY IF EXISTS "Authenticated users can insert exercise_relationships" ON exercise_relationships;
DROP POLICY IF EXISTS "Authenticated users can update exercise_relationships" ON exercise_relationships;
DROP POLICY IF EXISTS "Authenticated users can delete exercise_relationships" ON exercise_relationships;

CREATE POLICY "Coaches can insert exercise_relationships" ON exercise_relationships
  FOR INSERT TO authenticated
  WITH CHECK (public.is_coach_user(auth.uid()));

CREATE POLICY "Coaches can update exercise_relationships" ON exercise_relationships
  FOR UPDATE TO authenticated
  USING (public.is_coach_user(auth.uid()))
  WITH CHECK (public.is_coach_user(auth.uid()));

CREATE POLICY "Coaches can delete exercise_relationships" ON exercise_relationships
  FOR DELETE TO authenticated
  USING (public.is_coach_user(auth.uid()));