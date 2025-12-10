-- Add training_type_breakdown column to store raw training types with minutes
ALTER TABLE public.workout_stats 
ADD COLUMN IF NOT EXISTS training_type_breakdown JSONB DEFAULT '{}'::jsonb;