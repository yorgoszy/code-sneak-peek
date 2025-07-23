-- Add meeting_link column to booking_sessions table
ALTER TABLE public.booking_sessions 
ADD COLUMN meeting_link TEXT;