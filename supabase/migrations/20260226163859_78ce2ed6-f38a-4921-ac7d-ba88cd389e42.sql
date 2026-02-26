ALTER TABLE public.workout_completions 
ADD COLUMN IF NOT EXISTS checked_exercises jsonb DEFAULT '[]'::jsonb;