-- Add accessory_subphase column to user_weekly_phases table
ALTER TABLE public.user_weekly_phases 
ADD COLUMN IF NOT EXISTS accessory_subphase TEXT;