-- Fix RLS policies for strength_test_data to work with app_users
DROP POLICY IF EXISTS "Users can access own strength_test_data" ON public.strength_test_data;

CREATE POLICY "Users can access own strength_test_data" ON public.strength_test_data
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM test_sessions ts
    JOIN app_users au ON au.id = ts.user_id
    WHERE ts.id = test_session_id 
    AND au.auth_user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM test_sessions ts
    JOIN app_users au ON au.id = ts.user_id
    WHERE ts.id = test_session_id 
    AND au.auth_user_id = auth.uid()
  )
);

-- Fix RLS policies for anthropometric_test_data to work with app_users  
DROP POLICY IF EXISTS "Users can access own anthropometric_test_data" ON public.anthropometric_test_data;

CREATE POLICY "Users can access own anthropometric_test_data" ON public.anthropometric_test_data
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM test_sessions ts
    JOIN app_users au ON au.id = ts.user_id
    WHERE ts.id = test_session_id 
    AND au.auth_user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM test_sessions ts
    JOIN app_users au ON au.id = ts.user_id
    WHERE ts.id = test_session_id 
    AND au.auth_user_id = auth.uid()
  )
);

-- Add RLS policy for test_sessions
CREATE POLICY "Users can access their own test sessions" ON public.test_sessions
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM app_users au 
    WHERE au.id = user_id 
    AND au.auth_user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM app_users au 
    WHERE au.id = user_id 
    AND au.auth_user_id = auth.uid()
  )
);