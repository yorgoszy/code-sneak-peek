-- Add hypertrophy_minutes and accessory_minutes columns to workout_stats
ALTER TABLE public.workout_stats 
ADD COLUMN IF NOT EXISTS hypertrophy_minutes integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS accessory_minutes integer DEFAULT 0;