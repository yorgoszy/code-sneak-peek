
-- Drop broken test_sessions policy (correct one "Users can access their own test sessions" already exists)
DROP POLICY IF EXISTS "Users can access own test_sessions" ON public.test_sessions;

-- Drop broken functional_test_data policies
DROP POLICY IF EXISTS "Users can delete own functional_test_data" ON public.functional_test_data;
DROP POLICY IF EXISTS "Users can insert own functional_test_data" ON public.functional_test_data;
DROP POLICY IF EXISTS "Users can select own functional_test_data" ON public.functional_test_data;
DROP POLICY IF EXISTS "Users can update own functional_test_data" ON public.functional_test_data;

-- Add correct user write policies for functional_test_data (SELECT already exists via "Users can view their own functional_test_data")
CREATE POLICY "Users can insert their own functional_test_data"
ON public.functional_test_data FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM functional_test_sessions fts
    JOIN app_users au ON au.id = fts.user_id
    WHERE fts.id = functional_test_data.test_session_id
      AND au.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own functional_test_data"
ON public.functional_test_data FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM functional_test_sessions fts
    JOIN app_users au ON au.id = fts.user_id
    WHERE fts.id = functional_test_data.test_session_id
      AND au.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own functional_test_data"
ON public.functional_test_data FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM functional_test_sessions fts
    JOIN app_users au ON au.id = fts.user_id
    WHERE fts.id = functional_test_data.test_session_id
      AND au.auth_user_id = auth.uid()
  )
);
