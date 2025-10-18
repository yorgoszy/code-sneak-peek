-- Add INSERT, UPDATE, DELETE policies for anthropometric_test_sessions
CREATE POLICY "Admins can manage all anthropometric test sessions"
ON public.anthropometric_test_sessions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM app_users
    WHERE app_users.auth_user_id = auth.uid()
    AND app_users.role = 'admin'
  )
);

-- Fix anthropometric_test_data policy to reference correct table
DROP POLICY IF EXISTS "Users can access own anthropometric_test_data" ON public.anthropometric_test_data;

CREATE POLICY "Admins can manage all anthropometric test data"
ON public.anthropometric_test_data
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM app_users
    WHERE app_users.auth_user_id = auth.uid()
    AND app_users.role = 'admin'
  )
);
