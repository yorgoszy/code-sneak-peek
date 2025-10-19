-- Add child_birth_date column to app_users table
ALTER TABLE public.app_users 
ADD COLUMN IF NOT EXISTS child_birth_date date;

COMMENT ON COLUMN public.app_users.child_birth_date IS 'Birth date of the child (for parent users)';