-- Add unique constraint on user_exercise_1rm for (user_id, exercise_id)
-- This is required by the recalc_1rm_after_attempts_delete_stmt function
ALTER TABLE public.user_exercise_1rm 
ADD CONSTRAINT user_exercise_1rm_user_exercise_unique 
UNIQUE (user_id, exercise_id);