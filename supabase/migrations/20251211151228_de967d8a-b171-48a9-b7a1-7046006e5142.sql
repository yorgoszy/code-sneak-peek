-- Drop the incorrect foreign key constraint
ALTER TABLE public.functional_test_data 
DROP CONSTRAINT IF EXISTS fk_functional_test_data_session;

-- The correct FK already exists: functional_test_data_test_session_id_fkey
-- which references functional_test_sessions