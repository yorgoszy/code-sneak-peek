-- Ensure RLS is enabled (if already enabled, this is safe)
ALTER TABLE public.endurance_test_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.endurance_test_data ENABLE ROW LEVEL SECURITY;

-- Admins can manage all endurance_test_sessions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'endurance_test_sessions' AND policyname = 'Admins can manage all endurance_test_sessions'
  ) THEN
    CREATE POLICY "Admins can manage all endurance_test_sessions"
    ON public.endurance_test_sessions
    FOR ALL
    TO authenticated
    USING (public.get_current_user_role() = 'admin')
    WITH CHECK (public.get_current_user_role() = 'admin');
  END IF;
END$$;

-- Users can insert/update/delete their own endurance_test_sessions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'endurance_test_sessions' AND policyname = 'Users can manage own endurance_test_sessions'
  ) THEN
    CREATE POLICY "Users can manage own endurance_test_sessions"
    ON public.endurance_test_sessions
    FOR ALL
    TO authenticated
    USING (
      user_id IN (
        SELECT au.id FROM public.app_users au WHERE au.auth_user_id = auth.uid()
      )
    )
    WITH CHECK (
      user_id IN (
        SELECT au.id FROM public.app_users au WHERE au.auth_user_id = auth.uid()
      )
    );
  END IF;
END$$;

-- Clean up incorrect endurance_test_data policy if it references test_sessions
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'endurance_test_data' AND policyname = 'Users can access own endurance_test_data'
  ) THEN
    DROP POLICY "Users can access own endurance_test_data" ON public.endurance_test_data;
  END IF;
END$$;

-- Admins can manage all endurance_test_data
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'endurance_test_data' AND policyname = 'Admins can manage all endurance_test_data'
  ) THEN
    CREATE POLICY "Admins can manage all endurance_test_data"
    ON public.endurance_test_data
    FOR ALL
    TO authenticated
    USING (public.get_current_user_role() = 'admin')
    WITH CHECK (public.get_current_user_role() = 'admin');
  END IF;
END$$;

-- Users can manage their own endurance_test_data via join to endurance_test_sessions and app_users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'endurance_test_data' AND policyname = 'Users can manage own endurance_test_data'
  ) THEN
    CREATE POLICY "Users can manage own endurance_test_data"
    ON public.endurance_test_data
    FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1
        FROM public.endurance_test_sessions ets
        JOIN public.app_users au ON au.id = ets.user_id
        WHERE ets.id = endurance_test_data.test_session_id
          AND au.auth_user_id = auth.uid()
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1
        FROM public.endurance_test_sessions ets
        JOIN public.app_users au ON au.id = ets.user_id
        WHERE ets.id = endurance_test_data.test_session_id
          AND au.auth_user_id = auth.uid()
      )
    );
  END IF;
END$$;
