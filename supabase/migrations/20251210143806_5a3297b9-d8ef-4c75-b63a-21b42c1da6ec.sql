-- Προσθήκη πεδίου total_volume στον πίνακα workout_completions
ALTER TABLE public.workout_completions 
ADD COLUMN IF NOT EXISTS total_volume numeric DEFAULT 0;

-- Προσθήκη index για καλύτερη απόδοση στα queries
CREATE INDEX IF NOT EXISTS idx_workout_completions_user_status 
ON public.workout_completions(user_id, status);

-- Προσθήκη index για date range queries
CREATE INDEX IF NOT EXISTS idx_workout_completions_user_date 
ON public.workout_completions(user_id, scheduled_date);