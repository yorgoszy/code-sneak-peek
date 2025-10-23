-- Fix RLS so non-admin users can read their own strength test data via app_users mapping

-- Update SELECT policy on strength_test_sessions to map auth.uid() -> app_users.auth_user_id
ALTER POLICY "Users can view their own strength test sessions"
ON public.strength_test_sessions
USING (
  EXISTS (
    SELECT 1
    FROM public.app_users au
    WHERE au.id = strength_test_sessions.user_id
      AND au.auth_user_id = auth.uid()
  )
  OR auth.uid() = created_by
);

-- Update SELECT policy on strength_test_attempts to allow users to view attempts for sessions
-- where they are the mapped app_user or the creator
ALTER POLICY "Users can view strength test attempts"
ON public.strength_test_attempts
USING (
  EXISTS (
    SELECT 1
    FROM public.strength_test_sessions sts
    JOIN public.app_users au ON au.id = sts.user_id
    WHERE sts.id = strength_test_attempts.test_session_id
      AND (au.auth_user_id = auth.uid() OR sts.created_by = auth.uid())
  )
);
