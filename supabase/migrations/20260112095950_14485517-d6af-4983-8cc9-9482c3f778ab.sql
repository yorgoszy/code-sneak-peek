-- Add is_recovery_day column to program_days table
ALTER TABLE public.program_days 
ADD COLUMN is_recovery_day boolean DEFAULT false;