-- Fix overly permissive RLS policies on program tables
-- Replace USING(true) / WITH CHECK(true) with role-scoped policies

-- Helper function to check if user is a coach (avoid recursion)
CREATE OR REPLACE FUNCTION public.is_coach_user(_auth_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.app_users
    WHERE auth_user_id = _auth_uid
      AND role IN ('coach', 'admin', 'trainer')
  );
$$;

-- 1. program_assignments
DROP POLICY IF EXISTS "Users can manage program assignments" ON program_assignments;

CREATE POLICY "Authenticated users manage program assignments"
ON program_assignments FOR ALL
TO authenticated
USING (
  (user_id IN (SELECT id FROM app_users WHERE auth_user_id = auth.uid()))
  OR public.is_admin_user()
  OR public.is_coach_user(auth.uid())
)
WITH CHECK (
  (user_id IN (SELECT id FROM app_users WHERE auth_user_id = auth.uid()))
  OR public.is_admin_user()
  OR public.is_coach_user(auth.uid())
);

-- 2. program_weeks
DROP POLICY IF EXISTS "Users can manage program weeks" ON program_weeks;

CREATE POLICY "Authenticated coaches manage program weeks"
ON program_weeks FOR ALL
TO authenticated
USING (
  public.is_admin_user()
  OR public.is_coach_user(auth.uid())
  OR EXISTS (
    SELECT 1 FROM program_assignments pa
    JOIN programs p ON p.id = pa.program_id
    WHERE p.id = program_weeks.program_id
      AND pa.user_id IN (SELECT id FROM app_users WHERE auth_user_id = auth.uid())
  )
)
WITH CHECK (
  public.is_admin_user()
  OR public.is_coach_user(auth.uid())
);

-- 3. program_days
DROP POLICY IF EXISTS "Users can manage program days" ON program_days;

CREATE POLICY "Authenticated coaches manage program days"
ON program_days FOR ALL
TO authenticated
USING (
  public.is_admin_user()
  OR public.is_coach_user(auth.uid())
  OR EXISTS (
    SELECT 1 FROM program_weeks pw
    JOIN program_assignments pa ON pa.program_id = pw.program_id
    WHERE pw.id = program_days.week_id
      AND pa.user_id IN (SELECT id FROM app_users WHERE auth_user_id = auth.uid())
  )
)
WITH CHECK (
  public.is_admin_user()
  OR public.is_coach_user(auth.uid())
);

-- 4. program_blocks
DROP POLICY IF EXISTS "Users can manage program blocks" ON program_blocks;

CREATE POLICY "Authenticated coaches manage program blocks"
ON program_blocks FOR ALL
TO authenticated
USING (
  public.is_admin_user()
  OR public.is_coach_user(auth.uid())
  OR EXISTS (
    SELECT 1 FROM program_days pd
    JOIN program_weeks pw ON pw.id = pd.week_id
    JOIN program_assignments pa ON pa.program_id = pw.program_id
    WHERE pd.id = program_blocks.day_id
      AND pa.user_id IN (SELECT id FROM app_users WHERE auth_user_id = auth.uid())
  )
)
WITH CHECK (
  public.is_admin_user()
  OR public.is_coach_user(auth.uid())
);

-- 5. program_exercises
DROP POLICY IF EXISTS "Users can manage program exercises" ON program_exercises;

CREATE POLICY "Authenticated coaches manage program exercises"
ON program_exercises FOR ALL
TO authenticated
USING (
  public.is_admin_user()
  OR public.is_coach_user(auth.uid())
  OR EXISTS (
    SELECT 1 FROM program_blocks pb
    JOIN program_days pd ON pd.id = pb.day_id
    JOIN program_weeks pw ON pw.id = pd.week_id
    JOIN program_assignments pa ON pa.program_id = pw.program_id
    WHERE pb.id = program_exercises.block_id
      AND pa.user_id IN (SELECT id FROM app_users WHERE auth_user_id = auth.uid())
  )
)
WITH CHECK (
  public.is_admin_user()
  OR public.is_coach_user(auth.uid())
);