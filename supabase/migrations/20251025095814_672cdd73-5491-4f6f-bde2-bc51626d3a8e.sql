-- Add workout_stats column to ai_user_profiles
ALTER TABLE public.ai_user_profiles 
ADD COLUMN IF NOT EXISTS workout_stats jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.ai_user_profiles.workout_stats IS 'Stores current workout statistics including completed/missed workouts, active programs, upcoming sessions, and training schedule';