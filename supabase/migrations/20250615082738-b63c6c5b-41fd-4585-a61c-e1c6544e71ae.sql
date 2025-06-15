
-- Functional Test Data
ALTER TABLE public.functional_test_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own functional_test_data"
  ON public.functional_test_data
  FOR INSERT
  WITH CHECK (
    (SELECT user_id FROM test_sessions WHERE id = functional_test_data.test_session_id LIMIT 1) = auth.uid()
  );

CREATE POLICY "Users can select own functional_test_data"
  ON public.functional_test_data
  FOR SELECT
  USING (
    (SELECT user_id FROM test_sessions WHERE id = functional_test_data.test_session_id LIMIT 1) = auth.uid()
  );

CREATE POLICY "Users can update own functional_test_data"
  ON public.functional_test_data
  FOR UPDATE
  USING (
    (SELECT user_id FROM test_sessions WHERE id = functional_test_data.test_session_id LIMIT 1) = auth.uid()
  );

CREATE POLICY "Users can delete own functional_test_data"
  ON public.functional_test_data
  FOR DELETE
  USING (
    (SELECT user_id FROM test_sessions WHERE id = functional_test_data.test_session_id LIMIT 1) = auth.uid()
  );

-- Αντίστοιχα policies πρέπει να προστεθούν και για
-- anthropometric_test_data, endurance_test_data, jump_test_data, strength_test_data

ALTER TABLE public.anthropometric_test_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access own anthropometric_test_data"
  ON public.anthropometric_test_data
  FOR ALL
  USING (
    (SELECT user_id FROM test_sessions WHERE id = anthropometric_test_data.test_session_id LIMIT 1) = auth.uid()
  )
  WITH CHECK (
    (SELECT user_id FROM test_sessions WHERE id = anthropometric_test_data.test_session_id LIMIT 1) = auth.uid()
  );

ALTER TABLE public.endurance_test_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access own endurance_test_data"
  ON public.endurance_test_data
  FOR ALL
  USING (
    (SELECT user_id FROM test_sessions WHERE id = endurance_test_data.test_session_id LIMIT 1) = auth.uid()
  )
  WITH CHECK (
    (SELECT user_id FROM test_sessions WHERE id = endurance_test_data.test_session_id LIMIT 1) = auth.uid()
  );

ALTER TABLE public.jump_test_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access own jump_test_data"
  ON public.jump_test_data
  FOR ALL
  USING (
    (SELECT user_id FROM test_sessions WHERE id = jump_test_data.test_session_id LIMIT 1) = auth.uid()
  )
  WITH CHECK (
    (SELECT user_id FROM test_sessions WHERE id = jump_test_data.test_session_id LIMIT 1) = auth.uid()
  );

ALTER TABLE public.strength_test_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access own strength_test_data"
  ON public.strength_test_data
  FOR ALL
  USING (
    (SELECT user_id FROM test_sessions WHERE id = strength_test_data.test_session_id LIMIT 1) = auth.uid()
  )
  WITH CHECK (
    (SELECT user_id FROM test_sessions WHERE id = strength_test_data.test_session_id LIMIT 1) = auth.uid()
  );

-- Επίσης, στον πίνακα test_sessions:

ALTER TABLE public.test_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own test_sessions"
  ON public.test_sessions
  FOR ALL
  USING (
    user_id = auth.uid()
  )
  WITH CHECK (
    user_id = auth.uid()
  );
