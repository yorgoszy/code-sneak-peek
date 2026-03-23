-- Fix overly permissive RLS on mas_tests: replace USING(true) with scoped policies

-- Drop the permissive policy
DROP POLICY IF EXISTS "Authenticated can view mas_tests" ON mas_tests;

-- Coaches/admins can view all mas_tests
CREATE POLICY "Coaches and admins can view mas_tests"
  ON mas_tests FOR SELECT
  TO authenticated
  USING (public.is_coach_user(auth.uid()));

-- Athletes can view their own mas_tests (athlete_id is integer, so we can't directly compare with UUID)
-- Use a text cast comparison as a safe fallback for this legacy table
CREATE POLICY "Athletes can view own mas_tests"
  ON mas_tests FOR SELECT
  TO authenticated
  USING (athlete_id::text IN (
    SELECT id::text FROM app_users WHERE auth_user_id = auth.uid()
  ));