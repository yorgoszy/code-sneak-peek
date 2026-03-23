-- Fix permissive INSERT/UPDATE policies on sprint_timing_results
-- Scope to session creator or coach/admin

DROP POLICY IF EXISTS "Authenticated users can insert sprint results" ON sprint_timing_results;
DROP POLICY IF EXISTS "Authenticated users can update sprint results" ON sprint_timing_results;

CREATE POLICY "Users can insert own sprint results" ON sprint_timing_results
  FOR INSERT TO authenticated
  WITH CHECK (
    session_id IN (
      SELECT id FROM sprint_timing_sessions WHERE created_by = auth.uid()
    )
    OR public.is_coach_user(auth.uid())
  );

CREATE POLICY "Users can update own sprint results" ON sprint_timing_results
  FOR UPDATE TO authenticated
  USING (
    session_id IN (
      SELECT id FROM sprint_timing_sessions WHERE created_by = auth.uid()
    )
    OR public.is_coach_user(auth.uid())
  )
  WITH CHECK (
    session_id IN (
      SELECT id FROM sprint_timing_sessions WHERE created_by = auth.uid()
    )
    OR public.is_coach_user(auth.uid())
  );