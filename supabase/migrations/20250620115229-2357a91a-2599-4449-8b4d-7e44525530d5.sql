
-- Βελτίωση του πίνακα test_sessions για καλύτερη διαχείριση
ALTER TABLE public.test_sessions ADD COLUMN IF NOT EXISTS test_types text[] DEFAULT ARRAY[]::text[];
ALTER TABLE public.test_sessions ADD COLUMN IF NOT EXISTS completed_at timestamp with time zone;

-- Προσθήκη indexes για καλύτερη απόδοση
CREATE INDEX IF NOT EXISTS idx_test_sessions_user_date ON public.test_sessions(user_id, test_date);
CREATE INDEX IF NOT EXISTS idx_anthropometric_test_data_session ON public.anthropometric_test_data(test_session_id);
CREATE INDEX IF NOT EXISTS idx_functional_test_data_session ON public.functional_test_data(test_session_id);
CREATE INDEX IF NOT EXISTS idx_endurance_test_data_session ON public.endurance_test_data(test_session_id);
CREATE INDEX IF NOT EXISTS idx_jump_test_data_session ON public.jump_test_data(test_session_id);
CREATE INDEX IF NOT EXISTS idx_strength_test_data_session ON public.strength_test_data(test_session_id);

-- RLS για τον test_sessions αν δεν υπάρχει ήδη
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'test_sessions' 
        AND policyname = 'Users can access own test_sessions'
    ) THEN
        CREATE POLICY "Users can access own test_sessions"
          ON public.test_sessions
          FOR ALL
          USING (user_id = auth.uid())
          WITH CHECK (user_id = auth.uid());
    END IF;
END $$;
