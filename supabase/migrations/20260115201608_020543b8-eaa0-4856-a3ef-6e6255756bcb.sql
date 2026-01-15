-- Add section_id column to app_users table for default section assignment
ALTER TABLE public.app_users 
ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES public.booking_sections(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_app_users_section_id ON public.app_users(section_id);