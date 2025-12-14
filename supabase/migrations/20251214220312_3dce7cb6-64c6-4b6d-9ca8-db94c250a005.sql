-- Add gender column to app_users table
ALTER TABLE public.app_users 
ADD COLUMN gender text CHECK (gender IN ('male', 'female', 'other'));