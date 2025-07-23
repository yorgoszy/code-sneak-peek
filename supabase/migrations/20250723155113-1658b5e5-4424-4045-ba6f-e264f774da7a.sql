-- Drop the existing check constraint
ALTER TABLE public.booking_sessions DROP CONSTRAINT booking_sessions_status_check;

-- Add the new check constraint that includes 'pending' and 'rejected'
ALTER TABLE public.booking_sessions ADD CONSTRAINT booking_sessions_status_check 
CHECK (status = ANY (ARRAY['confirmed'::text, 'cancelled'::text, 'completed'::text, 'pending'::text, 'rejected'::text]));