-- Fix the foreign key constraint for endurance_test_data
-- Drop the wrong constraint that points to test_sessions
ALTER TABLE public.endurance_test_data 
DROP CONSTRAINT IF EXISTS fk_endurance_test_data_session;

-- Add the correct constraint that points to endurance_test_sessions
ALTER TABLE public.endurance_test_data 
ADD CONSTRAINT fk_endurance_test_data_session 
FOREIGN KEY (test_session_id) REFERENCES public.endurance_test_sessions(id) ON DELETE CASCADE;