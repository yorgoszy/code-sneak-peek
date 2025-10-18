-- Fix wrong FK on anthropometric_test_data pointing to test_sessions
-- Drop old/incorrect constraint and create correct one to anthropometric_test_sessions

-- 1) Drop existing FK (name from error: fk_anthropometric_test_data_session)
ALTER TABLE public.anthropometric_test_data
DROP CONSTRAINT IF EXISTS fk_anthropometric_test_data_session;

-- 2) Create correct FK to anthropometric_test_sessions(id)
ALTER TABLE public.anthropometric_test_data
ADD CONSTRAINT fk_anthropometric_test_data_session
FOREIGN KEY (test_session_id)
REFERENCES public.anthropometric_test_sessions (id)
ON DELETE CASCADE;
