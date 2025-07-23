-- Add foreign key constraint between booking_sessions and app_users
ALTER TABLE public.booking_sessions 
ADD CONSTRAINT fk_booking_sessions_user_id 
FOREIGN KEY (user_id) REFERENCES public.app_users(id)
ON DELETE CASCADE;