-- Add is_esd_day column to program_days table
ALTER TABLE public.program_days 
ADD COLUMN IF NOT EXISTS is_esd_day boolean DEFAULT false;