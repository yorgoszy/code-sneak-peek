-- Add terminal velocity column to exercises (exercise-specific constant for 1RM estimation)
ALTER TABLE public.exercises 
ADD COLUMN terminal_velocity numeric NULL;

COMMENT ON COLUMN public.exercises.terminal_velocity IS 'Minimum velocity (m/s) for a successful 1RM rep. Used in load-velocity profile calculations.';